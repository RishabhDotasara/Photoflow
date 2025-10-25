# file where all the workers are there 

from celery_config import celery
from contextlib import contextmanager
import os
import requests
import numpy as np
import cv2
import base64
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from redisClient import RedisClient
from db import add_image, get_project, get_db, insert_faces, update_project_status_if_done, mark_image_processed, update_project_status, get_unprocessed_images
from fastapi.responses import RedirectResponse
from fastapi import HTTPException
from googleapiclient.discovery import build
from helpers import credentials_for_user, get_drive_images
from sqlalchemy.exc import IntegrityError
import os 

_project_folder_namespace = "project_folder"

@contextmanager
def get_session():
    """Context manager for DB sessions in workers"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# SQLAlchemy models/session
from models import SessionLocal, Image, OAuthToken

# lazy-loaded model for image tasks
fa = None
redis_client = RedisClient()
redis_client.connect()

def ensure_model():
    global fa
    if fa is None:
        from insightface.app import FaceAnalysis
        ctx_id = int(os.getenv("CTX_ID", os.getenv("CTX_ID", -1)))
        det_size = tuple(map(int, os.getenv("DET_SIZE", os.getenv("DET_SIZE", "640,640")).split(",")))
        fa = FaceAnalysis(allowed_modules=["detection", "recognition"], providers=[ 'CPUExecutionProvider','CUDAExecutionProvider'])
        fa.prepare(ctx_id=ctx_id, det_size=det_size)

def download_image(download_url: str, access_token: str | None) -> np.ndarray:
    headers = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    resp = requests.get(download_url, headers=headers)
    resp.raise_for_status()
    img_array = np.frombuffer(resp.content, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

@celery.task(name="tasks.process_image")
def process_image(image_id:str, drive_file_id: str, download_url: str, access_token: str | None, project_id: str, user_id: str):
    """
    Heavy worker: downloads image using access_token (if provided), runs insightface,
    and POSTs callback or writes to DB as required.
    """
    try:
        img = download_image(download_url, access_token)
        ensure_model()
        faces = fa.get(img)
        
        with get_session() as db:
            faces_data = []
            for i, f in enumerate(faces, start=1):
                faces_data.append({
                    "face_index": i,
                    "bbox": list(map(int, f.bbox)),
                    "embedding": f.embedding
                })
            
            if faces_data:
                insert_faces(db=db, image_id=image_id, faces=faces_data)

            # increment the processed count
            processed = redis_client.increment(f'processed_images:{project_id}')
            total_key = redis_client.get_key(f'total_images:{project_id}')
            total = int(total_key) if total_key else 0
            
            print(f"Processed images for project {project_id}: {processed}/{total}")
            if total > 0 and total == processed:
                print("Project Completed. Updating status.")
                update_project_status(db, project_id, "completed")

            mark_image_processed(db, image_id)
            
        
        # for i, f in enumerate(faces, start=1):
        #     x1, y1, x2, y2 = map(int, f.bbox)
        #     cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        #     cv2.putText(img, str(i), (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        # # save annotated image to disk (for now)
        # out_path = f"processed_{drive_file_id}.jpg"
        # cv2.imwrite(out_path, img)
        # print(f"Processed image {image_id}, saved to {out_path}, detected {len(faces)} faces.")

    except Exception as e:
        # Celery will record failure; you can also post callback to your server here
        raise


@celery.task(name="tasks.list_folder_and_enqueue")
def list_folder_and_enqueue(project_id: str, user_id: str):
    """
    Orchestrator worker: reads Image rows for project_id (created earlier by server),
    refreshes user's Google access token, and enqueues process_image tasks to image_tasks queue.
    """
    with get_session() as db:
        # get the folder_id first from redis 
        proj = redis_client.get_dict(f"{_project_folder_namespace}:{project_id}")
        folder_id = proj.get("folder_id") if proj else None
        
        if not folder_id:
            # check in db as well 
            proj = get_project(db=db, project_id=project_id)
            folder_id = proj.drive_folder_id if proj else None
            if not folder_id:
                raise HTTPException(status_code=400, detail="Project not found or folder ID not set.")
        creds = credentials_for_user(user_id, redis_client)
        # get all image links from the folder using google drive api and push them on the queue to process 

        try:
            images = get_drive_images(folder_id=folder_id, creds=creds)
            
            # optionally store image list in redis or enqueue tasks here
            # batch create images in db before pushing to the queue 

            # redis_client.set_dict(f"project_images:{project_id}", {"count": len(images)})
            # enqueu the images to the processing queue 

            # get the list of images already in db to avoid duplicates
            db_images = db.query(Image.drive_file_id).filter(Image.project_id == project_id).all()
            existing_drive_file_ids = set(img.drive_file_id for img in db_images)

            print(existing_drive_file_ids)
            
        
            for img in images:
                try:
                    # deduplication check 
                    if img["id"] in existing_drive_file_ids:
                        continue
                    
                    add_image(
                        db=db,
                        project_id=project_id,
                        drive_file_id=img["id"],
                        name=img.get("name"),
                        mime_type=img.get("mimeType"),
                        download_url=img.get("download_url"),
                        thumbnail_link=img.get("thumbnail"),
                    )

                except IntegrityError as e:
                    db.rollback()
                    # image already exists, skip
                    continue

            # now get all unprocessed images from the db and put them on the processing queue 
            unprocessed_db_images = get_unprocessed_images(db=db, project_id=project_id)
            
            for img in unprocessed_db_images:
                try:
                    async_result = celery.send_task(
                            "tasks.process_image",
                            args=(
                                img.id,
                                img.drive_file_id,
                                img.download_url,
                                creds.token,
                                img.project_id,
                                user_id
                                )
                            )
                    print(f"Enqueued image {img.drive_file_id} task id: {async_result.id}")
                except Exception as e:
                    print(f"Failed to enqueue image {img.drive_file_id}: {e}")
                    continue
                
            redis_client.set_key(f"total_images:{project_id}",len(unprocessed_db_images))
            redis_client.set_key(f"processed_images:{project_id}", 0)

            update_project_status(db=db, project_id=project_id, status="processing")
            return {"status": "ok", "count": len(unprocessed_db_images), "images": unprocessed_db_images}
        except Exception as e:
            raise RuntimeError(f"Failed to list folder images: {str(e)}")
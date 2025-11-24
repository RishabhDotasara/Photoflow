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
from redisClient import redis_client
from db import add_image, get_project, get_db, insert_faces, update_project_status_if_done, mark_image_processed, update_project_status, get_unprocessed_images
from fastapi.responses import RedirectResponse
from fastapi import HTTPException
from googleapiclient.discovery import build
from helpers import credentials_for_user, get_drive_images, create_thumbnail, download_file_from_presigned_url, process_image_from_bytes
from sqlalchemy.exc import IntegrityError
import os 
from s3 import list_files_in_s3_folder, upload_file_to_s3_folder, generate_presigned_url, upload_file_to_s3_folder_memory, check_file_exists_in_s3_folder
from constants import THUMBNAILS_GENERATED_KEY, TOTAL_IMAGES_KEY, TOTAL_THUMBNAILS_KEY, IMAGES_PROCESSED_KEY

_project_folder_namespace = "project_folder"
_bucket_name = "researchconclave"


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
def process_image(image_id: str, download_url: str, project_id: str):
    try:
        presigned_url = generate_presigned_url(bucket=_bucket_name, object_name=download_url, expiration=3600)
        img_bytes = download_file_from_presigned_url(presigned_url)

        # Fix: Use correct variable name
        ext = download_url.split("/")[-1].split(".")[-1].lower()
        if ext in ['arw', 'nef', 'cr2', 'raw', 'dng', 'rw2']:
            img_bytes = process_image_from_bytes(img_bytes)  # Fix: use img_bytes

        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
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

           
            mark_image_processed(db, image_id)
            redis_client.increment(f"{IMAGES_PROCESSED_KEY}:{project_id}")
           
            processed_str = redis_client.get_key(f'{IMAGES_PROCESSED_KEY}:{project_id}')
            total_str = redis_client.get_key(f'{TOTAL_IMAGES_KEY}:{project_id}')
            
            processed = int(processed_str) if processed_str else 0
            total = int(total_str) if total_str else 0
            
            print(f"Image {image_id} processed. Progress: {processed}/{total}")

            # Fix: Use correct processed value after increment
            if total > 0 and processed >= total:
                print("Project Completed. Updating status.")
                update_project_status(db, project_id, "completed")
                # Ensure final counts are correct
                redis_client.set_key(f"{IMAGES_PROCESSED_KEY}:{project_id}", total)
                redis_client.set_key(f"{THUMBNAILS_GENERATED_KEY}:{project_id}", total)

    except Exception as e:
        print("Error processing image:", e)


@celery.task(name="tasks.generate_thumbnail")
def generate_thumbnail(image_id: str, download_url: str, project_drive_folder: str, project_id: str):
    try:
        download_presigned_url = generate_presigned_url(bucket=_bucket_name, object_name=download_url)
        img_content = download_file_from_presigned_url(download_presigned_url)

        ext = download_url.split("/")[-1].split(".")[-1].lower()
        if ext in ['arw', 'nef', 'cr2', 'raw', 'dng', 'rw2']:
            img_content = process_image_from_bytes(img_content)

        thumbnail = create_thumbnail(img_content)
        
        # Fix: Use consistent thumbnail naming
        base_name = download_url.split("/")[-1]
        thumbnail_name = f"{base_name}_thumbnail.jpg"
        
        if not check_file_exists_in_s3_folder(
            bucket=_bucket_name, 
            folder_path=f"thumbnails/{project_drive_folder}", 
            object_name=thumbnail_name
        ):
            upload_file_to_s3_folder_memory(
                file_content=thumbnail, 
                object_name=thumbnail_name,
                bucket=_bucket_name,
                folder_path=f"thumbnails/{project_drive_folder}"
            )
            
        print("Uploaded thumbnail for image", image_id)
        redis_client.increment(f"{THUMBNAILS_GENERATED_KEY}:{project_id}")
        
        # Debug: Show current progress
        thumb_count = redis_client.get_key(f'{THUMBNAILS_GENERATED_KEY}:{project_id}')
        total_count = redis_client.get_key(f'{TOTAL_THUMBNAILS_KEY}:{project_id}')
        print(f"Thumbnail Progress: {thumb_count}/{total_count}")
            
        async_result = celery.send_task(
            "tasks.process_image",
            args=(image_id, download_url, project_id),
            queue="image_tasks"  # Add explicit queue
        )
        print(f"Enqueued image {download_url} for processing, task id: {async_result.id}")
        
    except Exception as e:
        print(f"Failed to generate thumbnail for {download_url}: {e}")


@celery.task(name="tasks.list_folder_and_enqueue")
def list_folder_and_enqueue(project_id: str, user_id: str):
    """
    Orchestrator worker: reads Image rows for project_id (created earlier by server),
    refreshes user's Google access token, and enqueues process_image tasks to image_tasks queue.
    """
    with get_session() as db:

        proj = get_project(db=db, project_id=project_id)
        folder_id = proj.drive_folder_id if proj else None
        if not folder_id:
            raise HTTPException(status_code=400, detail="Project not found or folder ID not set.")

        try:
            update_project_status(db=db, project_id=project_id, status="processing")
            print("Marked project as processing")
            images = list_files_in_s3_folder(bucket=_bucket_name, folder_path=proj.drive_folder_id)

         
            # get the list of images already in db to avoid duplicates
            # use object key as drive_file_id
            db_images = db.query(Image.drive_file_id).filter(Image.project_id == project_id).all()
            existing_drive_file_ids = set([img.drive_file_id for img in db_images])

            # print(existing_drive_file_ids)
            
            for img in images:
                try:
                    # deduplication check 
                    if img in existing_drive_file_ids:
                        continue
                                       

                    add_image(
                        db=db,
                        project_id=project_id,
                        drive_file_id=img,
                        name=img,
                        mime_type="",
                        download_url="",
                        thumbnail_link="",
                    )

                    print("Added image to DB: ", img)

                except IntegrityError as e:
                    db.rollback()
                    # image already exists, skip
                    continue

            # now get all unprocessed images from the db and put them on the processing queue 
            unprocessed_db_images = get_unprocessed_images(db=db, project_id=project_id)

               # set stats in redis 
            redis_client.set_key(f"{TOTAL_IMAGES_KEY}:{project_id}", len(unprocessed_db_images))
            redis_client.set_key(f"{TOTAL_THUMBNAILS_KEY}:{project_id}", len(unprocessed_db_images))
            redis_client.set_key(f"{THUMBNAILS_GENERATED_KEY}:{project_id}", 0)
            redis_client.set_key(f"{IMAGES_PROCESSED_KEY}:{project_id}", 0)
            
            for img in unprocessed_db_images:
                try:
                    async_result = celery.send_task(
                            "tasks.generate_thumbnail",
                            args=(
                                img.id,
                                img.drive_file_id,
                                proj.drive_folder_id,
                                project_id
                                )
                            )
                    print(f"Enqueued image {img.drive_file_id} for thumbnail generation task id: {async_result.id}")
                except Exception as e:
                    print(f"Failed to enqueue image {img.drive_file_id}: {e}")
                    continue
                
            
            return {"status": "ok", "count": len(unprocessed_db_images), "images": unprocessed_db_images}
        except Exception as e:
            print("Error: ", e)
            
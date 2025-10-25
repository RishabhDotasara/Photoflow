
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse
from redisClient import RedisClient
from db import get_oauth_token, get_db
import os 
from insightface.app import FaceAnalysis
import cv2
import numpy as np 
from sqlalchemy.orm import Session
from models import Face, Image
from sqlalchemy import select, func , cast 
from pgvector.sqlalchemy import Vector


CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID","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")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET","801066432691-j43ni90q9l5spie8pd3oon7tgrqm7ej8.apps.googleusercontent.com")
REDIRECT_URI = os.getenv("DRIVE_REDIRECT_URI")
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

_oauth_states_namespace = "oauth_states"
_user_tokens_namespace = "user_tokens"
_project_folder_namespace = "project_folder"




def credentials_for_user(user_id: str, redis_client: RedisClient) -> Credentials:
    """
    Build google.oauth2.credentials.Credentials from tokens stored in Redis.
    Refreshes access token if needed and persists the new access_token back to Redis.
    """
    tok = redis_client.get_dict(f"{_user_tokens_namespace}:{user_id}")
    if not tok:
        # check in db as well 
        tok = get_oauth_token(db=next(get_db()), user_id=user_id, provider="google")
        if tok:
            tok = {
                "access_token": tok.access_token,
                "refresh_token": tok.refresh_token,
                "expires_in": None,
                "scope": tok.scope,
            }
            # persist to redis for faster access next time
            redis_client.set_dict(f"{_user_tokens_namespace}:{user_id}", tok)
        else:
            raise HTTPException(status_code=404, detail="user tokens not found")
    # print(f"CLIENT_ID: {CLIENT_ID}")
    # print(f"CLIENT_SECRET: {CLIENT_SECRET}")
    # print(f"refresh_token: {tok.get('refresh_token')}")
    # print(f"token_uri: https://oauth2.googleapis.com/token")
    creds = Credentials(
        token=tok.get("access_token"),
        refresh_token=tok.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES,
    )
    # print(creds)
    # refresh if expired
    if creds.expired and creds.refresh_token:
        try:
            print("Credentials Expired: Refreshing...")
            creds.refresh(Request())
            # persist refreshed access token and expiry info
            redis_client.set_dict(f"{_user_tokens_namespace}:{user_id}", {
                "access_token": creds.token,
                "refresh_token": tok.get("refresh_token"),
                "expires_in": getattr(creds, "expiry", None),
                "scope": tok.get("scope"),
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"failed to refresh token: {e}")
    return creds

def process_image(img_bytes):

    fa = FaceAnalysis(allowed_modules=['detection', 'recognition'], providers=[ 'CPUExecutionProvider'])
    fa.prepare(ctx_id=0, det_size=(640, 640))

    nparr = np.frombuffer(img_bytes, np.uint8) 
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image")
    
    faces = fa.get(img)  # list of face objects
    embeddings = []
    for i, f in enumerate(faces, start=1):
        print("bbox:", f.bbox)           # bounding box
        emb = f.embedding                # numpy array (typically 512-d)
        print("embedding shape:", emb.shape)
        # print("embedding: ", emb)
        embeddings.append(f.embedding)

    if len(faces) == 0:
        return None

    return embeddings
    


def find_similar_images(
    db: Session,
    query_embedding: np.ndarray,
    threshold: float = 0.6,
    limit: int = 10,
    project_id: str | None = None,
):
    """Find images whose faces are similar to the query embedding."""
    query_vector = query_embedding.tolist()
    vector_cast = cast(query_vector, Vector(512))

    # Compute cosine distance per face, group by image
    stmt = (
        select(
            Image,
            func.min(func.cosine_distance(Face.embedding, vector_cast)).label("best_distance")
        )
        .join(Face, Face.image_id == Image.id)
    )

    if project_id:
        stmt = stmt.where(Image.project_id == project_id)

    stmt = (
        stmt.where(func.cosine_distance(Face.embedding, vector_cast) <= threshold)
        .group_by(Image.id)
        .order_by("best_distance")
        .limit(limit)
    )

    results = db.execute(stmt).all()

    # results = [(Image, best_distance), ...]
    images = [{"image": image, "best_distance": dist} for image, dist in results]
    return images

def get_drive_images(folder_id: str, creds: Credentials) -> list[dict]:
    
    service = build("drive", "v3", credentials=creds, cache_discovery=False)
    # query: files in the folder and that are images
    q = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
    page_token = None
    images = []
    while True:
        resp = service.files().list(
            q=q,
            spaces="drive",
            # request thumbnailLink as well
            fields="nextPageToken, files(id, name, mimeType, thumbnailLink)",
            pageSize=100,
            pageToken=page_token
        ).execute()
        for f in resp.get("files", []):
            images.append({
                "id": f["id"],
                "name": f.get("name"),
                "mimeType": f.get("mimeType"),
                "thumbnail": f.get("thumbnailLink"),  
                # workers should download with Authorization header:
                "download_url": f"https://www.googleapis.com/drive/v3/files/{f['id']}?alt=media"
            })
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return images
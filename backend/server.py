from contextlib import contextmanager
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uuid 
import json 
from celery_config import celery
from typing import Optional, Dict, Any
from sqlalchemy.exc import IntegrityError

# file imports 
from redisClient import RedisClient
from db import save_oauth_token, SessionLocal, get_db, get_oauth_token, set_project_folder_id,get_unprocessed_images, add_image, get_project, clear_project_images, user_exists, check_project_exists
from helpers import credentials_for_user, get_drive_images, find_similar_images, download_file_from_presigned_url
from clerk import set_public_user_id

#google drive api imports 
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from s3 import list_files_in_s3_folder, generate_presigned_url, get_upload_presigned_url
from typing import *
import os 

app = FastAPI()

# CORS INIT 
origins = [
    "http://localhost:3000",  # e.g. your Next.js frontend
    "https://your-frontend-domain.com",
    "*"
]

# 👇 Add the middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Frontend origins allowed
    allow_credentials=True,           # Allow cookies / credentials
    allow_methods=["*"],              # Allow all HTTP methods
    allow_headers=["*"],              # Allow all headers
)


# REDIS CLIENT INITIALIZATION
redis_client = RedisClient()
try:
    redis_client.connect()
    print("Connected to Redis successfully.")
except RuntimeError as e:
    print(f"Error connecting to Redis: {e}")


# GOOGLE DRIVE API CONFIG 
CLIENT_ID = "801066432691-qp8orftfhfr6hfejuhglhvgropgbv54q.apps.googleusercontent.com"
CLIENT_SECRET = "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"
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
REDIRECT_URI = BACKEND_BASE_URL + "/auth/drive/callback"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
_bucket_name = "researchconclave"

# in memory stores for tokens, use redis here 
_oauth_states_namespace = "oauth_states"
_user_tokens_namespace = "user_tokens"
_project_folder_namespace = "project_folder"
# db = get_db()
    
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


@app.get("/")
def read_root():
    return {"status": "Server is running"}

# # HELPER FUNCTIONS
# def credentials_for_user(user_id: str, redis_client: RedisClient, ) -> Credentials:
#     """
#     Build google.oauth2.credentials.Credentials from tokens stored in Redis.
#     Refreshes access token if needed and persists the new access_token back to Redis.
#     """
#     tok = redis_client.get_dict(f"{_user_tokens_namespace}:{user_id}")
#     if not tok:
#         # check in db as well 
#         tok = get_oauth_token(db=next(get_db()), user_id=user_id, provider="google")
#         if tok:
#             tok = {
#                 "access_token": tok.access_token,
#                 "refresh_token": tok.refresh_token,
#                 "expires_in": None,
#                 "scope": tok.scope,
#             }
#             # persist to redis for faster access next time
#             redis_client.set_dict(f"{_user_tokens_namespace}:{user_id}", tok)
#         else:
#             raise HTTPException(status_code=404, detail="user tokens not found")

#     creds = Credentials(
#         token=tok.get("access_token"),
#         refresh_token=tok.get("refresh_token"),
#         token_uri="https://oauth2.googleapis.com/token",
#         client_id=CLIENT_ID,
#         client_secret=CLIENT_SECRET,
#         scopes=SCOPES,
#     )

#     # refresh if expired
#     if creds.expired and creds.refresh_token:
#         try:
#             creds.refresh(Request())
#             # persist refreshed access token and expiry info
#             redis_client.set_dict(f"{_user_tokens_namespace}:{user_id}", {
#                 "access_token": creds.token,
#                 "refresh_token": tok.get("refresh_token"),
#                 "expires_in": getattr(creds, "expiry", None),
#                 "scope": tok.get("scope"),
#             })
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"failed to refresh token: {e}")
#     return creds


# AUTH ROUTES 
@app.get("/auth/drive/start")
def drive_auth_start(user_id: str):
    """
    This endpoint would start the OAuth2 flow for Google Drive authentication.
    It would redirect the user to Google's OAuth2 consent screen.
    """

    if not CLIENT_ID or not CLIENT_SECRET:
        return {"error": "Google Drive API credentials are not configured."}
    
    state = str(uuid.uuid4())
    redis_client.set_dict(f"{_oauth_states_namespace}:{state}", {"user_id": user_id})
    scope_str = " ".join(SCOPES)
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={CLIENT_ID}"
        "&response_type=code"
        f"&scope={requests.utils.quote(scope_str)}"
        f"&redirect_uri={requests.utils.quote(REDIRECT_URI)}"
        "&access_type=offline"   # request refresh token
        "&prompt=consent"
        f"&state={state}"
    )

    return {"auth_url": auth_url}

@app.get("/auth/drive/callback")
def drive_auth_callback(code: str = None, state: str = None):
    """
    Exchange code for tokens. Save refresh_token 
    """
    if not code or not state:
        raise HTTPException(400, "missing code or state")

    info = redis_client.get_dict(f"{_oauth_states_namespace}:{state}")
    if info is None:
        raise HTTPException(400, "invalid state")

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    r = requests.post(token_url, data=data, timeout=10)
    r.raise_for_status()
    tok = r.json()
    # tok contains access_token, expires_in, refresh_token (only on first consent), token_type, scope
    print(info)
    user_id = info["user_id"]
    # Persist tokens: use DB in prod. Here we keep in memory redis store.
    save_oauth_token(
        db=next(get_db()),
        access_token=tok.get("access_token"),
        refresh_token=tok.get("refresh_token"),
        expires_at=None,
        scope=tok.get("scope"),
        provider="google",
        user_id=user_id
    )
    redis_client.set_dict(f"{_user_tokens_namespace}:{user_id}", {
        "access_token": tok.get("access_token"),
        "refresh_token": tok.get("refresh_token"),
        "expires_in": tok.get("expires_in"),
        "scope": tok.get("scope"),
    })
    # print(redis_client.get_dict(f"{_user_tokens_namespace}:{user_id}"))

    # here return redirect to the frontend page 
    # return {"status": "ok", "user_id": user_id}
    return RedirectResponse(url=f"http://localhost:3000/home")


@app.get("/list-folders")
def list_folders(user_id: str):
    """
    This endpoint would list the folders in the user's Google Drive. TThen user selects the folder with photos
    from the frontend.
    """

    try:
        creds = credentials_for_user(user_id, redis_client)
        service = build("drive", "v3", credentials=creds, cache_discovery=False)
        q = "mimeType='application/vnd.google-apps.folder' and trashed = false"
        folders = []
        result = service.files().list(q=q, spaces='drive', fields="nextPageToken, files(id, name)").execute()
        items = result.get('files', [])
        for item in items:
            folders.append({"id": item['id'], "name": item['name']})
        return {"count": len(folders), "folders": folders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/analyze-folder")
def analyze_folder(user_id: str, project_id: str):
    """
    This endpoint would trigger analysis of a folder containing images.
    Here we will fetch the image links from drive and then analyze them and store the embeddings in the database.
    """
    # just enqueue the task to process the folder

    proj = get_project(db=next(get_db()), project_id=project_id)
    if not proj or not proj.drive_folder_id:
        raise HTTPException(status_code=400, detail="project or folder_id not set")

    # enqueue the Celery task on the folder_tasks queue (task name must match worker registration)
    async_result = celery.send_task(
        "tasks.list_folder_and_enqueue",
        args=(project_id, user_id),
        queue="folder_tasks",
    )
    return {"status": "Folder analysis started.", "folder_task_id": async_result.id}

@app.get("/set-folder-id")
def set_folder_id(user_id: str, folder_id: str, project_id: str):
    """
    This endpoint is to set the folder id selected by the user for a project.
    """
    # we are setting all these so that cache moves alongside , and then we can implement cache also quit easily later
    redis_client.set_dict(f"{_project_folder_namespace}:{project_id}", {"user_id": user_id, "folder_id": folder_id})

    # first clear all the images related to the previous project id if any 
    with get_session() as db:
        clear_project_images(db=db, project_id=project_id)
        # set the folder id in db as well
        set_project_folder_id(
            db=db,
            project_id=project_id,
            drive_folder_id=folder_id
        )
    return {"status": "Folder ID set."}


@app.get("/get-photos")
def get_photos():
    """
    This endpoint is to return the match photos to the guest user.
    """
    return {"status": "Getting photos..."}


# CRUD OPERATIONS FOR MODELS CAN BE ADDED HERE AS NEEDED
class ProjectCreateRequest(BaseModel):
    user_id: str
    name: str = None

@app.post("/create-project")
def create_project_endpoint(request: ProjectCreateRequest):
    """
    Create a new project for the user.
    """
    user_id = request.user_id
    name = request.name
    # print("Creating project for user:", user_id, "with name:", name)
    from db import create_project
    with get_session() as db:
        # check if the project with this name exists or not 
        project = check_project_exists(db=db, user_id=user_id, name=name)

        if project:
            raise HTTPException(status_code=400, detail="Project with this name already exists for the user")

        project = create_project(
            db=db,
            user_id=user_id,
            name=name,
            s3_folder_name=user_id + "/" + name
        )
    return {"status": "ok", "project_id": project.id, "name": project.name}

@app.get("/get-project")
def get_project_endpoint(project_id: str):
    """
    Get project details by project_id.
    """
    from db import get_project
    with get_session() as db:
        project = get_project(
            db=db,
            project_id=project_id
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        images = list_files_in_s3_folder(bucket=_bucket_name, folder_path=project.drive_folder_id)
        out_of_sync = len(images) != len(project.images)
        # image_ids = [img.drive_file_id for img in project.images]

        # if out of sync, just insert those imagse back in the db with processed set to false 
        # if out_of_sync:
        #     for img in images:
        #         if img not in image_ids:
        #             try:
        #                 add_image(
        #                     db=db,
        #                     project_id=project.id,
        #                     drive_file_id=img,
        #                     name=img.get("name"),
        #                     mime_type=img.get("mimeType"),
        #                     download_url=img.get("download_url"),
        #                     thumbnail_link=img.get("thumbnail"),
        #                 )
        #             except IntegrityError as e:
        #                 db.rollback()
        #                 # image already exists, skip
        #                 continue
        
        
        project_data = {
            "project_id": project.id,
            "user_id": project.user_id,
            "name": project.name,
            "drive_folder_id": project.drive_folder_id,
            "status": project.status,
            "image_count": len(project.images),
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "out_of_sync": out_of_sync 
        }
    return {"status": "ok", "project": project_data}

@app.get("/list-projects")
def list_projects_endpoint(user_id: str):
    """
    List all projects for a user.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    from db import list_projects_by_user
    with get_session() as db:
        projects = list_projects_by_user(
            db=db,
            user_id=user_id
        )
        project_list = [{"project_id": p.id, "name": p.name, "status": p.status} for p in projects]
    return {"status": "ok", "projects": project_list}

class CreateUserRequest(BaseModel):
    email: str
    clerkId: str

# helper to get folder info 
def get_folder_info(user_id: str, folder_id: str):
    """
    Get information about a specific Google Drive folder
    """
    creds = credentials_for_user(user_id, redis_client)
    
    try:
        service = build("drive", "v3", credentials=creds, cache_discovery=False)
        
        # Get folder metadata
        folder = service.files().get(
            fileId=folder_id,
            fields="id, name, webViewLink, createdTime, modifiedTime, size, parents, shared, owners"
        ).execute()
        
        # Get folder contents count (optional)
        contents_query = f"'{folder_id}' in parents and trashed = false"
        contents = service.files().list(
            q=contents_query,
            fields="files(id)"
        ).execute()
        
        # Get image count specifically
        images_query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false"
        images = service.files().list(
            q=images_query,
            fields="files(id)"
        ).execute()
        
        return {
            "folder_id": folder["id"],
            "name": folder["name"],
            "web_view_link": folder.get("webViewLink"),
            "created_time": folder.get("createdTime"),
            "modified_time": folder.get("modifiedTime"),
            "is_shared": folder.get("shared", False),
            "owners": [owner.get("displayName", owner.get("emailAddress")) for owner in folder.get("owners", [])],
            "parent_folders": folder.get("parents", []),
            "total_files": len(contents.get("files", [])),
            "image_count": len(images.get("files", []))
        }
        
    except Exception as e:
        if "404" in str(e):
            raise HTTPException(status_code=404, detail="Folder not found or no access")
        raise HTTPException(status_code=500, detail=f"Error fetching folder info: {str(e)}") 

@app.get("/folder-drive-id-set")
def folder_drive_id_set_endpoint(project_id: str):
    """
    Check if the drive folder id is set for the project.
    """
    from db import check_folder_is_set
    with get_session() as db:
        is_set = check_folder_is_set(
            db=db,
            project_id=project_id
        )
        # if set then send the folder details 
        if is_set:
            proj = get_project(db=db, project_id=project_id)
            folder_info = get_folder_info(user_id=proj.user_id, folder_id=proj.drive_folder_id)
            return {"project_id": project_id, "bool": is_set, "folder_info": folder_info}

    return {"project_id": project_id, "bool": is_set}

@app.post("/create-user")
def create_user_endpoint(request: CreateUserRequest):
    """
    Create a new user.
    """
    email = request.email
    
    from db import create_user
    with get_session() as db:

        # check if the user already exists 
        userExists = user_exists(db=db, email=email)
        if userExists:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        user = create_user(
            db=db,
            email=email
        )
        # set the public user id in clerk as well
        set_public_user_id(clerk_user_id=request.clerkId, user_id=user.id)
        return {"status": "ok", "user_id": user.id, "email": user.email}
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-user")
def get_user_endpoint(email: str):
    """
    Get user by email.
    """
    from db import get_user_by_email
    with get_session() as db:
        user = get_user_by_email(db=db, email=email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "ok", "user_id": user.id, "email": user.email}

@app.get("/has-drive-permission")
def has_drive_permission(user_id: str):
    """
    Check if user has given Google Drive permission
    """
    from db import has_given_drive_permission
    with get_session() as db:
        has_permission = has_given_drive_permission(
            db=db,
            user_id=user_id
        )
    return {"user_id": user_id, "has_drive_permission": has_permission}

@app.get("/home-info")
def home_info(user_id: str):
    """
    Get info for home page: number of projects, ongoing processing projects
    """
    from db import get_project_info
    with get_session() as db:
        project_count, processing_projects = get_project_info(
            db=db,
            user_id=user_id
        )
        processing_list = [{"project_id": p.id, "name": p.name} for p in processing_projects]
    return {
        "user_id": user_id,
        "project_count": project_count,
        "processing_projects": processing_list
    }

# upload selfie endpoint 
@app.post("/guest/upload-selfie")
async def upload_selfie(
    project_id: str = Form(...),
    file: UploadFile = File(...)
):
    # Read file bytes
    image_bytes = await file.read()
    from helpers import process_image, find_similar_images

    # Convert to cv2 image and process
    try:
        print(f"Processing uploaded selfie for project {project_id}, filename: {file.filename}")
        embeddings = process_image(image_bytes)

        if not embeddings:
            return {
                "status": "ok",
                "matching_images_count": 0,
                "matching_images": []
            }
        # print("Embedding: ", embeddings)
        with get_session() as db:
            matching_images = find_similar_images(db=db, query_embedding=embeddings[0], project_id=project_id)
        # loop through images to get new presigned urls valid for one hour 
        # print(matching_images)
        for img in matching_images:
            # print(img)
            presigned_url = generate_presigned_url(bucket=_bucket_name, object_name=img['image']["drive_file_id"], expiration=3600)
            img["image"]["download_url"] = presigned_url
            img['image']['thumbnail_url'] = generate_presigned_url(bucket=_bucket_name, object_name="thumbnails/"+img['image']["drive_file_id"]+"_thumbnail.jpg", expiration=3600)

        return {
            "status": "ok",
            "matching_images_count": len(matching_images),
            "matching_images": matching_images
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")
    
from googleapiclient.http import MediaIoBaseDownload
from io import BytesIO
from fastapi import Response

@app.get("/drive-img/{file_id}")
def get_drive_image(file_id: str, user_id: str, download: Optional[bool] = False):
    """Serve a Google Drive image through your backend with caching + download support."""

    # 1️⃣ Get OAuth credentials for the user
    creds = credentials_for_user(user_id, redis_client)
    service = build("drive", "v3", credentials=creds)

    # 2️⃣ Fetch file metadata (for MIME type + name)
    try:
        file = service.files().get(fileId=file_id, fields="mimeType,name").execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found or inaccessible: {e}")

    mime_type = file.get("mimeType", "application/octet-stream")
    file_name = file.get("name", "download")

    # 3️⃣ Download file content
    request = service.files().get_media(fileId=file_id)
    buf = BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    buf.seek(0)

    disposition = "attachment" if download else "inline"


    # 4️⃣ Return with proper headers
    headers = {
        "Cache-Control": "public, max-age=86400",  # cache 1 day
        "Content-Disposition": f'{disposition}; filename="{file_name}"'  # or attachment for forced download
    }

    return Response(content=buf.read(), media_type=mime_type, headers=headers)

@app.get("/get-progress")
def get_progress(project_id: str):
    total_images = redis_client.get_key("total_images:${project_id}")
    processed_images = redis_client.get_key(f"processed_images:{project_id}")
    return {
        "project_id": project_id,
        "total_images": int(total_images) if total_images else 0,
        "processed_images": int(processed_images) if processed_images else 0,
        "percent_complete": (int(processed_images) / int(total_images) * 100) if total_images and processed_images else 0
    }

@app.get("/resync-drive-folder")
def resync_drive_folder(user_id: str, project_id: str):
    # get all unprocessed images from the db 
    async_result = celery.send_task(
        "tasks.list_folder_and_enqueue",
        args=(project_id, user_id),
        queue="folder_tasks",
    )
    return {"status": "Folder resyncing started.", "folder_task_id": async_result.id}

@app.get("/get-signed-url")
def get_presigned_url_to_upload(object_name:str):
    try:
        presigned_url = get_upload_presigned_url(bucket=_bucket_name, object_name=object_name)
        return {"status": "ok", "presigned_url": presigned_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")
    

class FileNames(BaseModel): 
    file_names: List[str]
import zipfile
@app.post("/get-all-files-zip")
async def download_all(file_names: FileNames):
    # Create a buffer to store the ZIP file in memory
    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for idx, file_key in enumerate(file_names.file_names):
            try:
                # Assuming file_key is a presigned URL
                file_data = download_file_from_presigned_url(file_key)
                file_name = os.path.basename(file_key.split("?")[0])
                zip_file.writestr(file_name, file_data)  # Store using file name
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error downloading file {file_key}: {str(e)}")

    # Seek to the beginning of the BytesIO buffer for the response
    zip_buffer.seek(0)

    # Return the ZIP file as a StreamingResponse
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=files.zip"}
    )
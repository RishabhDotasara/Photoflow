from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import SessionLocal
from typing import List, Dict, Any, Optional, Generator
from models import User, OAuthToken, Project, Image, Task, Face
from datetime import datetime
import uuid
from s3 import upload_file_to_s3_folder
from sqlalchemy.orm import noload


def get_db() -> Generator:
    db = SessionLocal() 
    try:
        yield db
    finally:
        db.close()

def gen_uuid() -> str:
    return str(uuid.uuid4())

# model methods 
def create_user(db:Session, email:Optional[str]=None) -> User:
    new_user = User(id=gen_uuid(),email=email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def user_exists(db:Session, email:str) -> bool:
    user = db.query(User).filter(User.email == email).one_or_none()
    return user is not None

def get_user_by_email(db:Session, email:str) -> Optional[User]:
    return db.query(User).filter(User.email == email).one_or_none()


def save_oauth_token(db:Session, user_id:str, provider:str, refresh_token:Optional[str], access_token:Optional[str], scope:Optional[str], expires_at:Optional[datetime]) -> OAuthToken:
    oauth_token = OAuthToken(
        user_id=user_id,
        provider=provider,
        refresh_token=refresh_token,
        access_token=access_token,
        scope=scope,
        expires_at=expires_at
    )
    db.add(oauth_token)
    db.commit()
    db.refresh(oauth_token)
    return oauth_token 


def get_oauth_token(db:Session, user_id:str, provider:str) -> Optional[OAuthToken]:
    return db.query(OAuthToken).filter(OAuthToken.user_id == user_id, OAuthToken.provider == provider).order_by(OAuthToken.created_at.desc()).first()


def create_project(db:Session, user_id:str, name:Optional[str]=None, s3_folder_name:Optional[str]=None, config:Optional[Dict[str, Any]]=None) -> Project:
    new_project = Project(
        id=gen_uuid(),
        user_id=user_id,
        name=name,
        drive_folder_id=s3_folder_name,
        config=config,
        status="waiting"
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)


    upload_file_to_s3_folder(
        bucket="researchconclave",
        file_name="test.jpg",
        folder_path=new_project.drive_folder_id,
    )

    return new_project

def check_project_exists(db:Session, user_id:str, name:str) -> bool:
    project = db.query(Project).filter(Project.user_id == user_id, Project.name == name).one_or_none()
    return project is not None

def update_project_status(db:Session, project_id:str, status:str):
    project = db.query(Project).filter(Project.id == project_id).one_or_none()
    if not project:
        raise ValueError("project not found")
    project.status = status
    project.updated_at = datetime.utcnow()
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def update_project_status_if_done(db:Session, project_id: str):
    total = db.query(Image).filter_by(project_id=project_id).count()
    processed = db.query(Image).filter_by(project_id=project_id, processed=True).count()

    if total > 0 and total == processed:
        project = db.query(Project).filter_by(id=project_id).first()
        if project.status != "completed":
            project.status = "completed"
            project.updated_at = datetime.utcnow()
            db.commit()

def mark_image_processed(db: Session, image_id: str):
    img = db.query(Image).filter(Image.id == image_id).one_or_none()
    if not img:
        raise ValueError("image not found")
    img.processed = True
    db.add(img)
    db.commit()
    db.refresh(img)
    return img

def get_unprocessed_images(db: Session, project_id: str) -> List[Image]:
    return db.query(Image).filter(Image.project_id == project_id, Image.processed == False).all()

def get_project(db: Session, project_id: str) -> Optional[Project]:
    return db.query(Project).options(noload(Project.images)).filter(Project.id == project_id).one_or_none()

def get_number_of_images(db: Session, project_id: str) -> int:
    return db.query(Image).filter(Image.project_id == project_id).count()

def list_projects_by_user(db: Session, user_id: str) -> List[Project]:
    return db.query(Project).filter(Project.user_id == user_id).all()



def check_folder_is_set(db: Session, project_id: str) -> bool:
    project = get_project(db, project_id)
    if not project:
        raise ValueError("project not found")
    return project.drive_folder_id is not None

def set_project_folder_id(db: Session, project_id: str, drive_folder_id: str) -> Project:
    project = get_project(db, project_id)
    if not project:
        raise ValueError("project not found")
    project.drive_folder_id = drive_folder_id
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def clear_project_images(db:Session, project_id:str):
    db.query(Image).filter(Image.project_id == project_id).delete()
    db.commit()

def add_image(
    db: Session,
    project_id: str,
    drive_file_id: str,
    name: Optional[str] = None,
    mime_type: Optional[str] = None,
    size_bytes: Optional[int] = None,
    download_url: Optional[str] = None,
    thumbnail_link: Optional[str] = None,
) -> Image:
    img = Image(
        id=gen_uuid(),
        project_id=project_id,
        drive_file_id=drive_file_id,
        name=name,
        mime_type=mime_type,
        size_bytes=size_bytes,
        download_url=download_url,
        thumbnail_link=thumbnail_link,
        processed=False,
    )
    db.add(img)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(img)
    return img


def create_task(db: Session, project_id: Optional[str], user_id: Optional[str], image_id: Optional[str]) -> Task:
    t = Task(id=gen_uuid(), project_id=project_id, user_id=user_id, image_id=image_id, status="queued", progress=0)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

def update_task_status(db: Session, task_id: str, status: str, progress: Optional[int] = None, result: Optional[Dict[str, Any]] = None) -> Task:
    t = db.query(Task).filter(Task.id == task_id).one_or_none()
    if not t:
        raise ValueError("task not found")
    t.status = status
    if progress is not None:
        t.progress = progress
    if result is not None:
        t.result = result
    t.updated_at = datetime.utcnow()
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


# # FACES / EMBEDDINGS
def insert_faces(db: Session, image_id: str, faces: List[Dict[str, Any]]) -> List[Face]:
    """
    faces: list of dicts with keys: face_index(int), bbox(list[int]), embedding(list[float]), metadata(dict)
    """
    objs = []
    for f in faces:
        obj = Face(
            image_id=image_id,
            embedding=f.get("embedding"),
        )
        objs.append(obj)
    db.bulk_save_objects(objs)
    print(f"Inserting {len(objs)} faces for image {image_id}")
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    # refresh returned objects
    return db.query(Face).filter(Face.image_id == image_id)

def mark_image_processed(db: Session, image_id: str):
    img = db.query(Image).filter(Image.id == image_id).one_or_none()
    if not img:
        raise ValueError("image not found")
    img.processed = True
    db.add(img)
    db.commit()
    db.refresh(img)
    return img

# auth methods 
def has_given_drive_permission(db:Session, user_id: str):
    """ Check if user has given Google Drive permission 
        Check if there are any oauth tokens issued with this userId
    """
    token = db.query(OAuthToken).filter(OAuthToken.user_id == user_id, OAuthToken.provider == "google")
    return token is not None

def get_project_info(db:Session, user_id:str) -> int:
    count = db.query(Project).filter(Project.user_id == user_id).count()
    # get projects which are under processing
    processing_projects = db.query(Project).filter(Project.user_id == user_id, Project.status == "processing")
    return count, processing_projects


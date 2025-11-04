from datetime import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, Boolean,
    JSON, Enum, Float, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB, TEXT
from sqlalchemy.orm import relationship, declarative_base, mapped_column
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from pgvector.sqlalchemy import Vector
import os 
from dotenv import load_dotenv

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL, 
    pool_size=5,          # Reduced pool size
    max_overflow=10,      # Reduced overflow
    pool_pre_ping=True,   # Test connections before use
    pool_recycle=1800,    # Recycle connections every 30 minutes
    pool_reset_on_return='commit',  # Reset connections on return
    echo=False            # Set to True for SQL debugging
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


Base = declarative_base()
# Base.metadata.create_all(bind=engine)

def gen_uuid():
    return str(uuid.uuid4())

# Status enums (simple strings)
TaskStatus = Enum("queued", "processing", "done", "failed", name="task_status")

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    oauth_tokens = relationship("OAuthToken", back_populates="user")
    projects = relationship("Project", back_populates="owner")

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String, nullable=False)  # e.g. "google"
    refresh_token = Column(TEXT, nullable=True)  # store encrypted in prod
    access_token = Column(TEXT, nullable=True)
    scope = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="oauth_tokens")

class Project(Base):
    __tablename__ = "projects"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=True)
    drive_folder_id = Column(String, nullable=True, index=True)  # Google Drive folder id
    config = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String, nullable=False, server_default="waiting")  # processing, completed, failed, waiting
    owner = relationship("User", back_populates="projects")
    images = relationship("Image", back_populates="project")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True, index=True)
    image_id = Column(UUID(as_uuid=False), ForeignKey("images.id"), nullable=True, index=True)
    status = Column(TaskStatus, nullable=False, server_default="queued")
    progress = Column(Integer, default=0)  # 0-100
    result = Column(JSONB, nullable=True)  # worker callback payload
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")

class Image(Base):
    __tablename__ = "images"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=True, index=True)
    drive_file_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    download_url = Column(String, nullable=True)      # workers can use proxy or server-provided URL
    thumbnail_link = Column(String, nullable=True)    # Drive thumbnailLink
    processed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="images")
    faces = relationship("Face", back_populates="image")

    __table_args__ = (
        UniqueConstraint("project_id", "drive_file_id", name="uq_project_drivefile"),
    )

class Face(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(UUID(as_uuid=False), ForeignKey("images.id"), nullable=False, index=True)
    # task_id = Column(UUID(as_uuid=False), ForeignKey("tasks.id"), nullable=True, index=True)
    # face_index = Column(Integer, nullable=False)  # order in image
    # bbox = Column(ARRAY(Integer), nullable=False)  # [x1,y1,x2,y2]
    # Option A: use pgvector for efficient similarity search (recommended)
    # from pgvector.sqlalchemy import Vector
    # embedding = Column(Vector(1536))  # adjust dim to your model (512, 1536, etc.)
    # Option B: fallback to float array
    embedding = mapped_column(Vector(512))
    # embedding_norm = Column(Float, nullable=True)  # optional precomputed norm
    # metadata = Column(JSONB, nullable=True)  # any extra (landmarks, score)
    created_at = Column(DateTime, default=datetime.utcnow)

    image = relationship("Image", back_populates="faces")

# helpful indexes for queries
# Index("ix_faces_image_faceidx", Face.image_id, Face.face_index)
# if using pgvector, create an index for vector search in migration: CREATE INDEX ON faces USING ivfflat (embedding vector_l2_ops) ...

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
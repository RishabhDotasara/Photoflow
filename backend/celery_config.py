from celery import Celery
from kombu import Queue
import os 

BROKER = "redis://127.0.0.1:6379/0"
BACKEND = "redis://127.0.0.1:6379/1"

celery = Celery("photoflow", broker=BROKER, backend=BACKEND)
import tasks 

# define queues
celery.conf.task_queues = (
    Queue("folder_tasks"),
    Queue("image_tasks"),
)

celery.conf.task_default_queue = "folder_tasks"

# route by task name
celery.conf.task_routes = {
    "tasks.list_folder_and_enqueue": {"queue": "folder_tasks"},
    "tasks.process_image": {"queue": "image_tasks"},
}
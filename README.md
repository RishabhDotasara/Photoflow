# Photoflow

An AI-powered photo management application with facial recognition and Google Drive integration.

## Prerequisites

- PostgreSQL with pgvector extension (recommended via Docker)
- Redis server
- GCC or G++ compiler (for building face recognition models)
- Python 3.8+
- Node.js 18+

## Installation & Setup

### 1. Clone the Repository
```bash 
git clone https://github.com/RishabhDotasara/Photoflow.git
```

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Create a `.env` file with the following environment variables (obtain your values from Clerk): 

```bash 
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dW5pZmllZC1iYXJuYWNsZS01MS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_1ya2xJfxsGPbb0SeFezH4Pk3T16aC6ip5YCWhO0WD8
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
```

Install dependencies and start the development server:

```bash
npm install
npm run dev 
```

# Running the backend 

```bash 
cd backend
python -m venv venv 
```

Activate the virtual environment:

**Linux/macOS:**
```bash 
source venv/bin/activate
```

**Windows:**
```bash 
venv\Scripts\activate
```

Install the required packages:
```bash 
pip install -r requirements.txt
```
*Note: This may take some time as it builds face recognition models and requires GCC.*

### 4. Database Setup

Set up PostgreSQL with pgvector using Docker: 
```bash 
docker run -d \
  --name pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
    ankane/pgvector
```

### 5. Environment Variables

Set up the following environment variables for the backend:

and put this connection string in the database url 
```bash 
postgresql://postgres:postgres@localhost:5432/postgres
```

### 3. Backend Setup

Navigate to the backend directory and create a virtual environment: 
```bash 
```bash 
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
export REDIS_URL=redis://localhost:6379/0
export PYTHONUNBUFFERED=1
export CELERY_BROKER_URL=redis://localhost:6379/0
export CELERY_RESULT_BACKEND=redis://localhost:6379/0
export BACKEND_BASE_URL=http://localhost:8000
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret 
```

*Get your Google OAuth client ID and secret from the Google Cloud Console.*

### 6. Database Migration

Apply migrations to create the database tables:

```bash 
alembic upgrade head 
```

### 7. Start the Services

Start the backend server:
```bash 
uvicorn server:app --reload
```

In a separate terminal, start the Celery worker:
```bash 
celery -A celery_config worker --loglevel=info --concurrency=4
```

### 8. Access the Application

The application is now running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

You can now access the frontend to use the application.

now everything is running and you can go on the frontend address and enjoy the app 
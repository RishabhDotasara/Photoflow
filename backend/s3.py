# upload a document to s3
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from botocore.config import Config
import base64
import os
import json
from dotenv import load_dotenv
# Initialize S3 client
s3 = boto3.resource('s3')
# Custom configuration for S3 client
load_dotenv()
# Load environment variables
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_KEY')
if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
    raise ValueError("AWS credentials not found in environment variables")

# Debug: Print partial credentials to verify they're loaded (for debugging only)
print(f"AWS Access Key ID loaded: {AWS_ACCESS_KEY_ID[:8]}..." if AWS_ACCESS_KEY_ID else "No Access Key")
print(f"AWS Secret Key loaded: {AWS_SECRET_ACCESS_KEY[:8]}..." if AWS_SECRET_ACCESS_KEY else "No Secret Key")
# Set up S3 client with custom configuration
s3_config = Config(
    region_name='ap-south-1',  # Change to your region
    signature_version='s3v4',
    retries={
        'max_attempts': 10,
        'mode': 'standard'
    }
)
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=s3_config
)
def upload_file_to_s3(file_name, bucket, object_name=None):
    """
    Upload a file to an S3 bucket

    :param file_name: File to upload
    :param bucket: Bucket to upload to
    :param object_name: S3 object name. If not specified then file_name is used
    :return: True if file was uploaded, else False
    """
    if object_name is None:
        object_name = file_name

    # Use the already configured s3_client instead of creating a new one
    try:
        s3_client.upload_file(file_name, bucket, object_name)
        print(f"File {file_name} uploaded to {bucket}/{object_name}")
        return True
    except (NoCredentialsError, PartialCredentialsError) as e:
        print(f"Credentials error: {e}")
        return False
    except Exception as e:
        print(f"Failed to upload {file_name} to {bucket}/{object_name}: {e}")
        return False
    
def upload_file_to_s3_folder(file_name, bucket, folder_path, object_name=None):
    """
    Upload a file to a specific folder in an S3 bucket

    :param file_name: File to upload
    :param bucket: Bucket to upload to
    :param folder_path: Folder path in S3 (e.g., "documents/proposals")
    :param object_name: S3 object name. If not specified then file_name is used
    :return: True if file was uploaded, else False
    """
    if object_name is None:
        object_name = file_name
    
    # Ensure folder path ends with a slash and combine with object name
    if folder_path and not folder_path.endswith('/'):
        folder_path += '/'
    
    full_object_name = f"{folder_path}{object_name}"
    
    return upload_file_to_s3(file_name, bucket, full_object_name)

# get a file in base64 format
def get_file_from_s3(bucket, object_name):
    """
    Download a file from an S3 bucket and return its content in base64 format

    :param bucket: Bucket to download from
    :param object_name: S3 object name
    :return: Base64 encoded content of the file
    """
    try:
        response = s3_client.get_object(Bucket=bucket, Key=object_name)
        file_content = response['Body'].read()
        return base64.b64encode(file_content).decode('utf-8')
    except Exception as e:
        print(f"Failed to download {object_name} from {bucket}: {e}")
        return None

def parse_s3_url(s3_url):
    """
    Parse an S3 URL and extract bucket name and object key
    
    :param s3_url: S3 URL in format s3://bucket-name/object-key or https://bucket-name.s3.region.amazonaws.com/object-key
    :return: Tuple of (bucket_name, object_key) or (None, None) if invalid
    """
    import re
    from urllib.parse import urlparse
    
    try:
        if s3_url.startswith('s3://'):
            # Handle s3:// URLs
            parsed = urlparse(s3_url)
            bucket = parsed.netloc
            object_key = parsed.path.lstrip('/')
            return bucket, object_key
        
        elif 'amazonaws.com' in s3_url:
            # Handle HTTPS S3 URLs
            parsed = urlparse(s3_url)
            
            # Handle virtual-hosted-style URLs: https://bucket-name.s3.region.amazonaws.com/object-key
            if parsed.hostname and parsed.hostname.endswith('.amazonaws.com'):
                # Extract bucket from hostname
                hostname_parts = parsed.hostname.split('.')
                if len(hostname_parts) >= 4 and hostname_parts[1] == 's3':
                    bucket = hostname_parts[0]
                    object_key = parsed.path.lstrip('/')
                    return bucket, object_key
            
            # Handle path-style URLs: https://s3.region.amazonaws.com/bucket-name/object-key
            elif '/s3.' in s3_url or s3_url.startswith('https://s3.'):
                path_parts = parsed.path.lstrip('/').split('/', 1)
                if len(path_parts) >= 2:
                    bucket = path_parts[0]
                    object_key = path_parts[1]
                    return bucket, object_key
        
        return None, None
    
    except Exception as e:
        print(f"Error parsing S3 URL: {e}")
        return None, None

def get_file_from_s3_url(s3_url):
    """
    Download a file from S3 using an S3 URL and return its content in base64 format
    
    :param s3_url: S3 URL (s3://bucket/key or https://bucket.s3.region.amazonaws.com/key)
    :return: Base64 encoded content of the file or None if failed
    """
    bucket, object_key = parse_s3_url(s3_url)
    
    if not bucket or not object_key:
        print(f"Invalid S3 URL format: {s3_url}")
        return None
    
    print(f"Parsed URL - Bucket: {bucket}, Object: {object_key}")
    return get_file_from_s3(bucket, object_key)



if __name__ == "__main__":
    # Example usage
    bucket_name = "your-bucket-name"
    
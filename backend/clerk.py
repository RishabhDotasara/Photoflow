from clerk_backend_api import Clerk
import requests

CLERK_SECRET_KEY = "sk_test_1ya2xJfxsGPbb0SeFezH4Pk3T16aC6ip5YCWhO0WD8"
CLERK_API_BASE = "https://api.clerk.com/v1"

clerk_client = Clerk(
        bearer_auth=CLERK_SECRET_KEY,
    )
def set_public_user_id(clerk_user_id: str, user_id: str):
    clerk_client.users.update_metadata(
        user_id=clerk_user_id,
        public_metadata={"userId": user_id}
    )

def set_user_verified(clerk_user_id: str, verified: bool):
    clerk_client.users.update_metadata(
        user_id=clerk_user_id,
        public_metadata={"verified": verified}
    )




def create_clerk_user():
    user = clerk_client.users.create_user()
    return user

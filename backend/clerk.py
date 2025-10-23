
import requests

CLERK_SECRET_KEY = "sk_test_1ya2xJfxsGPbb0SeFezH4Pk3T16aC6ip5YCWhO0WD8"
CLERK_API_BASE = "https://api.clerk.com/v1"

def set_public_user_id(clerk_user_id: str, user_id: str):
    url = f"{CLERK_API_BASE}/users/{clerk_user_id}/metadata"

    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "public_metadata": {
            "userId": user_id
        }
    }

    response = requests.patch(url, headers=headers, json=data)

    if response.status_code == 200:
        print("✅ userId added to public_metadata")
    else:
        print("❌ Failed to update metadata:", response.text)

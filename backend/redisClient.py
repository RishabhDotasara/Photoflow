import redis 
import json 
import os 

class RedisClient: 

    def __init__(self):
        "initialize redis uri's here"
        self.redis_uri = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client = redis.Redis.from_url(self.redis_uri)

    def connect(self):
        "connect to redis server"
        try:
            self.client.ping()
        except redis.exceptions.ConnectionError as e:
            raise RuntimeError(f"Unable to connect to Redis at {self.redis_uri}") from e
        except redis.exceptions.TimeoutError as e:
            raise RuntimeError(f"Ping to Redis timed out for {self.redis_uri}") from e
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when connecting to {self.redis_uri}: {e}") from e
        return True
    
    def set_key(self, key:str, value:str):
        try :
            self.client.set(key, value)
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis Error while setting key {key}")
        
    def get_key(self, key:str) -> str:
        try:
            value = self.client.get(key)
            return value.decode('utf-8') if value else None
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when getting key {key}: {e}") from e
        
    def increment(self, key:str):
        try: 
            return self.client.incr(key)
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when setting key {key}: {e}") from e
        
    def set_dict(self, key: str, value: dict):
        "set a dict value for a given key"
        try: 
            # print(f"Setting key {key} with value {value}")
            self.client.set(key, json.dumps(value))
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when setting key {key}: {e}") from e
        
    def get_dict(self, key: str) -> dict:
        "get a dict value for a given key"
        try:
            value = self.client.get(key)
            # print(f"Getting key {key} with value {value}")
            return json.loads(value) if value else {}
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when getting key {key}: {e}") from e
        
    def delete_key(self, key: str):
        "delete a given key"
        try:
            self.client.delete(key)
        except redis.exceptions.RedisError as e:
            raise RuntimeError(f"Redis error when deleting key {key}: {e}") from e

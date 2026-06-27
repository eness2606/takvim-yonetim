import redis
from app.config import settings

client = redis.from_url(settings.REDIS_URL, decode_responses=True)
import nest_asyncio
import uvicorn
import redis
import hashlib
import signal
import sys
from fastapi import FastAPI, Request, HTTPException, Depends, Form
from starlette.middleware.base import BaseHTTPMiddleware
from user_agents import parse
from pydantic import BaseModel
from typing import Optional
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.connection import ConnectionPool

# Enable nested asyncio for Colab
nest_asyncio.apply()

# Initialize FastAPI app
app = FastAPI(title="API Security Demo")

# Redis connection pool
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

try:
    redis_pool = ConnectionPool(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True,
        max_connections=10
    )
    redis_client = redis.Redis(connection_pool=redis_pool)
    # Test connection
    redis_client.ping()
except RedisConnectionError:
    print("Warning: Could not connect to Redis. Running in limited mode.")
    redis_client = None

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    print("\nShutting down API server...")
    if redis_client:
        redis_pool.disconnect()
        print("Redis connection closed.")
    print("Cleanup completed.")

# Signal handlers for graceful shutdown
def signal_handler(sig, frame):
    print("\nReceived shutdown signal")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Security Settings
MAX_FAILED_ATTEMPTS = 5  # Max login failures before blocking
BLOCK_TIME = 300  # Block time in seconds (5 minutes)
ANOMALY_THRESHOLD = 10  # Requests per second threshold
FINGERPRINT_EXPIRY = 3600  # Expiry time for device fingerprinting

# Helper function for Redis operations
async def redis_operation(operation, *args, **kwargs):
    if redis_client is None:
        return None
    try:
        return operation(*args, **kwargs)
    except RedisConnectionError:
        print("Warning: Redis operation failed")
        return None

# Middleware for Threat Detection
class ThreatDetectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        user_agent = request.headers.get("User-Agent", "")
        parsed_ua = parse(user_agent)
        device_fingerprint = hashlib.sha256(f"{parsed_ua.os} {parsed_ua.browser}".encode()).hexdigest()

        if redis_client:
            # Rate Limiting - Prevent excessive requests
            request_count_key = f"requests:{client_ip}"
            request_count = await redis_operation(redis_client.incr, request_count_key)
            await redis_operation(redis_client.expire, request_count_key, 1)

            if request_count and request_count > ANOMALY_THRESHOLD:
                await redis_operation(redis_client.setex, f"blocked:{client_ip}", BLOCK_TIME, "1")
                raise HTTPException(status_code=429, detail="Too many requests detected. IP blocked.")

            # Check if IP is already blocked
            if await redis_operation(redis_client.exists, f"blocked:{client_ip}"):
                raise HTTPException(status_code=403, detail="Your IP is blocked due to multiple failed attempts.")

            # Track device fingerprinting
            fingerprint_key = f"fingerprint:{device_fingerprint}"
            await redis_operation(redis_client.sadd, fingerprint_key, client_ip)
            await redis_operation(redis_client.expire, fingerprint_key, FINGERPRINT_EXPIRY)

        response = await call_next(request)
        return response

# Add middleware
app.add_middleware(ThreatDetectionMiddleware)

# Pydantic model for JSON input
class LoginData(BaseModel):
    username: str
    password: str

# Login Endpoint with separate routes for different input methods
@app.post("/login/user")
async def login_form(
    request: Request,
    username: str = Form(...),
    password: str = Form(...)
):
    return await process_login(username, password, request)

@app.post("/login/product")
async def login_json(request: Request, data: LoginData):
    return await process_login(data.username, data.password, request)

@app.post("/login/checkout")
async def login_query(
    request: Request,
    username: str,
    password: str
):
    return await process_login(username, password, request)

# Common login processing function
async def process_login(username: str, password: str, request: Request):
    client_ip = request.client.host
    correct_username = "admin"
    correct_password = "password"

    if username == correct_username and password == correct_password:
        if redis_client:
            await redis_operation(redis_client.delete, f"failed_attempts:{client_ip}")
        return {"message": "Login successful", "status": "success"}

    if redis_client:
        # Track failed login attempts
        failed_attempts_key = f"failed_attempts:{client_ip}"
        failed_attempts = await redis_operation(redis_client.incr, failed_attempts_key)
        await redis_operation(redis_client.expire, failed_attempts_key, BLOCK_TIME)

        if failed_attempts and failed_attempts >= MAX_FAILED_ATTEMPTS:
            await redis_operation(redis_client.setex, f"blocked:{client_ip}", BLOCK_TIME, "1")
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "Too many failed attempts. IP blocked!",
                    "remaining_time": BLOCK_TIME,
                    "status": "blocked"
                }
            )
    else:
        failed_attempts = 1

    raise HTTPException(
        status_code=401,
        detail={
            "message": "Invalid credentials",
            "remaining_attempts": MAX_FAILED_ATTEMPTS - (failed_attempts or 0),
            "status": "failed"
        }
    )

# Root Endpoint
@app.get("/")
async def root():
    return {
        "message": "Threat Detection API is running!",
        "endpoints": {
            "form_login": "/login/user",
            "json_login": "/login/product",
            "query_login": "/login/checkout"
        },
        "redis_status": "connected" if redis_client else "disconnected"
    }

if __name__ == '__main__':
    print("Starting Threat Detection API on http://localhost:8000")
    print(f"Redis status: {'Connected' if redis_client else 'Disconnected'}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
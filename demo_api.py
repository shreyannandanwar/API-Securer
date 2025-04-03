import nest_asyncio
import uvicorn
import redis
import hashlib
from fastapi import FastAPI, Request, HTTPException, Depends, Form
from starlette.middleware.base import BaseHTTPMiddleware
from user_agents import parse
from pydantic import BaseModel

# Enable nested asyncio for Colab
nest_asyncio.apply()

# Initialize FastAPI app
app = FastAPI()

# Connect to Redis (Colab doesn't support Redis locally, use Redis Cloud if needed)
redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

# Security Settings
MAX_FAILED_ATTEMPTS = 5  # Max login failures before blocking
BLOCK_TIME = 300  # Block time in seconds (5 minutes)
ANOMALY_THRESHOLD = 10  # Requests per second threshold
FINGERPRINT_EXPIRY = 3600  # Expiry time for device fingerprinting

# Middleware for Threat Detection
class ThreatDetectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        user_agent = request.headers.get("User-Agent", "")
        parsed_ua = parse(user_agent)
        device_fingerprint = hashlib.sha256(f"{parsed_ua.os} {parsed_ua.browser}".encode()).hexdigest()

        # Rate Limiting - Prevent excessive requests
        request_count_key = f"requests:{client_ip}"
        request_count = redis_client.incr(request_count_key)
        redis_client.expire(request_count_key, 1)  # Reset every second

        if request_count > ANOMALY_THRESHOLD:
            redis_client.setex(f"blocked:{client_ip}", BLOCK_TIME, "1")
            raise HTTPException(status_code=429, detail="Too many requests detected. IP blocked.")

        # Check if IP is already blocked
        if redis_client.exists(f"blocked:{client_ip}"):
            raise HTTPException(status_code=403, detail="Your IP is blocked due to multiple failed attempts.")

        # Track device fingerprinting
        fingerprint_key = f"fingerprint:{device_fingerprint}"
        redis_client.sadd(fingerprint_key, client_ip)
        redis_client.expire(fingerprint_key, FINGERPRINT_EXPIRY)

        response = await call_next(request)
        return response

# Add middleware
app.add_middleware(ThreatDetectionMiddleware)

# Pydantic model for JSON input
class LoginData(BaseModel):
    username: str
    password: str

# Login Endpoint
@app.post("/login/")
async def login(
    username: str = Form(None),  # Optional form data
    password: str = Form(None),  # Optional form data
    request: Request = None,
    data: LoginData = None  # Optional JSON body
):
    client_ip = request.client.host
    correct_username = "admin"
    correct_password = "password"

    # Try to get data from query parameters first (default behavior)
    query_username = request.query_params.get("username")
    query_password = request.query_params.get("password")

    # Prioritize query parameters, then form data, then JSON
    final_username = query_username or username or (data.username if data else None)
    final_password = query_password or password or (data.password if data else None)

    # Check if all required fields are provided
    if not all([final_username, final_password]):
        raise HTTPException(status_code=422, detail="Username and password are required")

    if final_username == correct_username and final_password == correct_password:
        redis_client.delete(f"failed_attempts:{client_ip}")  # Reset failed attempts
        return {"message": "Login successful"}

    # Track failed login attempts
    failed_attempts_key = f"failed_attempts:{client_ip}"
    failed_attempts = redis_client.incr(failed_attempts_key)
    redis_client.expire(failed_attempts_key, BLOCK_TIME)

    if failed_attempts >= MAX_FAILED_ATTEMPTS:
        redis_client.setex(f"blocked:{client_ip}", BLOCK_TIME, "1")
        raise HTTPException(status_code=403, detail="Too many failed attempts. IP blocked!")

    raise HTTPException(status_code=401, detail="Invalid credentials")

# Root Endpoint
@app.get("/")
async def root():
    return {"message": "Threat Detection API is running!"}

if __name__ == '__main__':
    print("Starting Threat Detection API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
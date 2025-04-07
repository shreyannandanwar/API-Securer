import nest_asyncio
import uvicorn
import redis
import hashlib
import signal
import sys
import asyncio
from fastapi import FastAPI, Request, HTTPException, Depends, Form
from starlette.middleware.base import BaseHTTPMiddleware
from user_agents import parse
from pydantic import BaseModel
from typing import Optional
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.connection import ConnectionPool

# Enable nested asyncio
nest_asyncio.apply()

# Initialize FastAPI app with security metadata
app = FastAPI(
    title="API Security Demo",
    description="Enterprise-grade API Security Implementation",
    version="2.1.0",
    docs_url="/security-docs",
    redoc_url=None
)

# Enhanced Redis configuration
REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "db": 0,
    "decode_responses": True,
    "max_connections": 20,
    "retry_on_timeout": True,
    "health_check_interval": 30
}

# Connection pool with error resilience
try:
    redis_pool = ConnectionPool(**REDIS_CONFIG)
    redis_client = redis.Redis(connection_pool=redis_pool)
    # Validate connection with retry
    for _ in range(3):
        if redis_client.ping():
            break
        time.sleep(0.5)
    else:
        raise RedisConnectionError("Failed to connect after 3 attempts")
except RedisConnectionError as e:
    print(f"Critical Redis Error: {str(e)}")
    sys.exit(1)

# Security Constants (Environment variables recommended for production)
SECURITY_CONFIG = {
    "MAX_FAILED_ATTEMPTS": 5,
    "BLOCK_TIME": 300,
    "ANOMALY_THRESHOLD": 15,  # Increased threshold
    "FINGERPRINT_EXPIRY": 3600,
    "RATE_LIMIT_WINDOW": 60  # 60-second window for rate limiting
}

# Async wrapper for Redis operations
async def async_redis_command(command, *args):
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(None, lambda: getattr(redis_client, command)(*args))
    except RedisConnectionError:
        return None

# Enhanced signal handling
def shutdown_handler(sig, frame):
    print("\n🛑 Graceful shutdown initiated")
    redis_pool.disconnect()
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)

# Advanced Threat Detection Middleware
class AdvancedThreatMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        user_agent = request.headers.get("User-Agent", "")
        
        # Deep User Agent Analysis
        parsed_ua = parse(user_agent)
        device_profile = {
            "browser": parsed_ua.browser.family,
            "os": parsed_ua.os.family,
            "device": parsed_ua.device.family,
            "is_bot": parsed_ua.is_bot
        }
        
        # Bot Detection
        if device_profile["is_bot"]:
            raise HTTPException(403, "Bot traffic not allowed")
        
        # Behavioral Fingerprinting
        fingerprint = hashlib.sha256(
            f"{device_profile['os']}:{device_profile['browser']}:{user_agent}".encode()
        ).hexdigest()
        
        # Rate Limiting with sliding window
        rate_key = f"rate:{client_ip}"
        current = await async_redis_command("incr", rate_key)
        if current == 1:
            await async_redis_command("expire", rate_key, SECURITY_CONFIG["RATE_LIMIT_WINDOW"])
        elif current > SECURITY_CONFIG["ANOMALY_THRESHOLD"]:
            await async_redis_command("setex", f"block:{client_ip}", SECURITY_CONFIG["BLOCK_TIME"], "1")
            raise HTTPException(429, "Rate limit exceeded")
        
        # IP Reputation Check
        if await async_redis_command("exists", f"block:{client_ip}"):
            raise HTTPException(403, "Blocked IP detected")
        
        # Request fingerprinting
        await async_redis_command("hset", "fingerprints", fingerprint, client_ip)
        
        response = await call_next(request)
        return response

app.add_middleware(AdvancedThreatMiddleware)

# Unified Login Model
class AuthRequest(BaseModel):
    username: str
    password: str
    client_info: Optional[dict] = None

# Enhanced Login Endpoints
@app.post("/auth/form")
async def form_auth(
    request: Request,
    username: str = Form(..., min_length=3, max_length=20),
    password: str = Form(..., min_length=8)
):
    return await process_auth(request, username, password)

@app.post("/auth/json")
async def json_auth(request: Request, credentials: AuthRequest):
    return await process_auth(request, credentials.username, credentials.password)

async def process_auth(request: Request, username: str, password: str):
    client_ip = request.client.host
    valid_creds = {"username": "admin", "password": "securePass123!"}
    
    if username != valid_creds["username"] or password != valid_creds["password"]:
        attempts_key = f"attempts:{client_ip}"
        attempts = await async_redis_command("incr", attempts_key) or 0
        
        if attempts >= SECURITY_CONFIG["MAX_FAILED_ATTEMPTS"]:
            await async_redis_command("setex", f"block:{client_ip}", SECURITY_CONFIG["BLOCK_TIME"], "1")
            raise HTTPException(403, "Account locked")
            
        remaining = SECURITY_CONFIG["MAX_FAILED_ATTEMPTS"] - attempts
        raise HTTPException(401, f"Invalid credentials - {remaining} attempts remaining")
    
    # Reset on successful auth
    await async_redis_command("delete", f"attempts:{client_ip}")
    return {"status": "authenticated", "security": "2FA required"}

# Security Health Endpoint
@app.get("/security-status")
async def security_status():
    return {
        "redis": "active" if redis_client.ping() else "inactive",
        "failed_logins": await async_redis_command("keys", "attempts:*") or [],
        "blocked_ips": await async_redis_command("keys", "block:*") or [],
        "threat_level": "low"
    }

if __name__ == '__main__':
    print("🔒 Enterprise Security API Initializing")
    print(f"• Redis Status: {'✅ Connected' if redis_client.ping() else '❌ Disconnected'}")
    print(f"• Security Profile: {SECURITY_CONFIG}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        timeout_keep_alive=30,
        log_config=None  # Disable default logs for security
    )
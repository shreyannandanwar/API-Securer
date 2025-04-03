from flask import Flask, request, jsonify
import redis
import time
from functools import wraps
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blacklist.db'
db = SQLAlchemy(app)

# Initialize Redis for temporary blacklist
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

# Rate Limiting Middleware
limiter = Limiter(get_remote_address, app=app, default_limits=["100 per hour", "10 per minute"])

# Blacklist Database Model
class Blacklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(100), unique=True, nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

db.create_all()

# Function to Check if IP is Blacklisted
def is_blacklisted(ip):
    # Check in Redis (Temporary Blacklist)
    if redis_client.get(ip):
        return True
    # Check in Database (Persistent Blacklist)
    return Blacklist.query.filter_by(ip_address=ip).first() is not None

# Middleware to Block Blacklisted IPs
@app.before_request
def block_blacklisted_ips():
    ip = request.remote_addr
    if is_blacklisted(ip):
        return jsonify({"error": "Access Denied - Blacklisted"}), 403

# Endpoint to Log Requests and Detect Threats
@app.route('/api/protected', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def protected_resource():
    ip = request.remote_addr
    failed_attempts = int(redis_client.get(f"failed:{ip}") or 0)
    
    # Simulate Brute-Force Protection
    if failed_attempts >= 5:
        redis_client.setex(ip, 3600, "blocked")  # Block for 1 hour
        return jsonify({"error": "Too many failed attempts, you are temporarily blocked."}), 403
    
    return jsonify({"message": "Access Granted"})

# Endpoint to Manually Blacklist an IP
@app.route('/api/blacklist', methods=['POST'])
def add_to_blacklist():
    data = request.get_json()
    ip = data.get('ip')
    if ip:
        redis_client.setex(ip, 3600, "blocked")  # Temporary Block
        if not Blacklist.query.filter_by(ip_address=ip).first():
            db.session.add(Blacklist(ip_address=ip))
            db.session.commit()
        return jsonify({"message": "IP blacklisted successfully"})
    return jsonify({"error": "Invalid IP"}), 400

# Real-Time Logs Endpoint
@app.route('/api/logs', methods=['GET'])
def get_logs():
    logs = redis_client.lrange("request_logs", 0, -1)
    return jsonify({"logs": logs})

if __name__ == '__main__':
    app.run(debug=True)

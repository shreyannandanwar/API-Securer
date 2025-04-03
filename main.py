import pandas as pd
import random
import os
from datetime import datetime, timedelta

# Step 1: Create a directory
directory = "/content/api_security"
os.makedirs(directory, exist_ok=True)  # Ensure the directory exists

# Step 2: Generate synthetic data
num_records = 1000
start_time = datetime(2025, 4, 1, 0, 0, 0)

# List of fake IPs and user agents
ip_addresses = [f"192.168.1.{i}" for i in range(1, 100)]
user_agents = ["Mozilla/5.0", "Chrome/110", "Safari/537", "Edge/88"]

data = []

for _ in range(num_records):
    timestamp = start_time + timedelta(seconds=random.randint(0, 86400))
    ip = random.choice(ip_addresses)
    user_agent = random.choice(user_agents)
    request_path = random.choice(["/login", "/dashboard", "/api/data", "/logout"])
    status_code = random.choice([200, 401, 429])
    login_attempt = 1 if request_path == "/login" else 0
    failed_attempts = random.randint(0, 5) if login_attempt else 0
    block_status = 1 if failed_attempts > 3 else 0

    data.append([timestamp, ip, user_agent, request_path, status_code, login_attempt, failed_attempts, block_status])

# Step 3: Create DataFrame
df = pd.DataFrame(data, columns=[
    "timestamp", "ip_address", "user_agent", "request_path", 
    "status_code", "login_attempt", "failed_attempts", "block_status"
])

# Step 4: Save as CSV inside the created directory
file_path = os.path.join(directory, "api_security_logs.csv")
df.to_csv(file_path, index=False)

# Step 5: Verify the file creation
print(f"Dataset saved at: {file_path}")
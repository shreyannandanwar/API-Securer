import requests
import random
import time
import numpy as np
from joblib import load
import pandas as pd

# Load the trained model
model = load('random_forest_ddos.pkl')
BASE_URL = "http://localhost:8000"

# Function to generate a random IP address
def random_ip():
    return ".".join(str(random.randint(1, 255)) for _ in range(4))

# Generate traffic data (ensure it matches the model’s expected input format)
def generate_traffic(is_attack=False):
    return {
        "packet_size": random.randint(1400, 1500) if is_attack else random.randint(64, 1500),
        "packet_rate": random.randint(9000, 10000) if is_attack else random.randint(1, 1000),
        "source_ip": random_ip(),
        "destination_ip": "192.168.1.1"
    }

# Predict whether the traffic is a DDoS attack
def predict_attack(traffic):
    # Convert IPs to numerical format (if required by the model)
    traffic["source_ip"] = int("".join(traffic["source_ip"].split(".")))
    traffic["destination_ip"] = int("".join(traffic["destination_ip"].split(".")))

    df = pd.DataFrame([traffic])  # Convert dict to DataFrame
    prediction = model.predict(df)  # Predict using the trained model
    return prediction

# Function to send a login request
def send_login(payload):
    headers = {
        "X-Forwarded-For": random_ip(),
        "User-Agent": "Security-Tester/1.0"
    }
    try:
        return requests.post(
            f"{BASE_URL}/login/",
            data=payload,
            headers=headers,
            timeout=2
        )
    except Exception as e:
        print(f"Request failed: {str(e)}")
        return None

# Run the security test scenario
def test_scenario():
    credentials = [
        {"username": "admin", "password": "password"},
        {"username": "invalid", "password": "wrong"}
    ]

    for i in range(1, 51):
        is_attack = i % 5 == 0  # Every 5th request simulates an attack
        traffic = generate_traffic(is_attack)
        ddos_prediction = predict_attack(traffic)
        creds = random.choice(credentials)

        headers = {  # Define headers inside the loop
            "X-Forwarded-For": random_ip(),
            "User-Agent": "Security-Tester/1.0"
        }

        response = send_login(creds)

        print(f"\nRequest {i}:")
        print(f"IP: {headers['X-Forwarded-For']}")
        print(f"Predicted DDoS: {'Yes' if ddos_prediction else 'No'}")
        print(f"Credentials: {creds['username']}:{creds['password']}")

        if response:
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("Login Successful")
            elif response.status_code == 401:
                remaining = response.headers.get('X-Remaining-Attempts', 'Unknown')
                print(f"Remaining Attempts: {remaining}")
            elif response.status_code == 403:
                block_time = response.headers.get('X-Block-Time-Remaining', 0)
                print(f"IP Blocked - Time Remaining: {block_time}s")

        time.sleep(random.uniform(0.2, 1.5))  # Random delay between requests

# Main execution
if __name__ == "__main__":
    print("Starting Security Test Suite")
    print(f"Model Version: {model.__class__.__name__} v1.0")
    test_scenario()
    print("\nTest Complete!")

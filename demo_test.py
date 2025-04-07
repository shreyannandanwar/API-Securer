import requests
import random
import json
import time

# Generate a random IP
def random_ip():
    return ".".join(str(random.randint(1, 255)) for _ in range(4))

# Test configurations
BASE_URL = "http://localhost:8000"
AUTH_METHODS = ['product', 'user', 'checkout']
TEST_CREDENTIALS = [
    {"username": "admin", "password": "password"},  # Valid credentials
    {"username": "wrong", "password": "wrong"}      # Invalid credentials
]

def send_login_request(auth_method, credentials, headers):
    url = f"{BASE_URL}/login/{auth_method}"
    
    if auth_method == 'product':
        response = requests.post(url, json=credentials, headers=headers)
    elif auth_method == 'user':
        response = requests.post(url, data=credentials, headers=headers)
    else:  # checkout
        response = requests.post(url, params=credentials, headers=headers)
    
    return response

def print_response(response, ip):
    try:
        result = response.json()
        output = f"IP: {ip}, Status Code: {response.status_code}"
        
        # Handle successful response
        if response.status_code == 200:
            output += f", Status: {result.get('status', 'unknown')}"
            output += f", Message: {result.get('message', 'No message')}"
        
        # Handle error response
        elif isinstance(result, dict) and 'detail' in result:
            detail = result['detail']
            if isinstance(detail, dict):
                output += f", Status: {detail.get('status', 'error')}"
                output += f", Message: {detail.get('message', 'Unknown error')}"
                if 'remaining_attempts' in detail:
                    output += f", Remaining attempts: {detail['remaining_attempts']}"
                if 'remaining_time' in detail:
                    output += f", Block time remaining: {detail['remaining_time']}s"
            else:
                output += f", Message: {detail}"
        
        print(output)
        
    except json.JSONDecodeError:
        print(f"IP: {ip}, Status Code: {response.status_code}, Raw Response: {response.text}")
    except Exception as e:
        print(f"IP: {ip}, Status Code: {response.status_code}, Error parsing response: {str(e)}")

def main():
    total_requests = 50  # Adjust as needed
    delay = 0.1  # Delay between requests to prevent overwhelming the server

    for i in range(total_requests):
        # Randomly select authentication method and credentials
        auth_method = random.choice(AUTH_METHODS)
        credentials = random.choice(TEST_CREDENTIALS)
        
        # Generate random IP and create headers
        ip = random_ip()
        headers = {
            "X-Forwarded-For": ip,
            "User-Agent": "Mozilla/5.0 (Test Script)"
        }

        try:
            response = send_login_request(auth_method, credentials, headers)
            print(f"\nRequest {i+1}/{total_requests} ({auth_method} method):")
            print_response(response, ip)
        except requests.exceptions.RequestException as e:
            print(f"Error making request: {e}")

        time.sleep(delay)  # Add delay between requests

if __name__ == "__main__":
    main()


# curl -X POST "http://localhost:8000/login/?username=admin&password=password"
# {"message": "Login successful"}.
# curl -X POST http://localhost:8000/login/ -d "username=admin" -d "password=password"
# {"message": "Login successful"}.
# http://localhost:8000/login/?
# 422
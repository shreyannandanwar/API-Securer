import requests

response = requests.get('http://localhost:8000/')
print(response.status_code)  # Should be 200

response = requests.post('http://localhost:8000/login/', data={'username': 'admin', 'password': 'password'})
print(response.status_code)  # Should be 200

response = requests.post('http://localhost:8000/login/', data={'username': 'wrong', 'password': 'wrong'})
print(response.status_code)  # Should be 401

# curl -X POST "http://localhost:8000/login/?username=admin&password=password"
# {"message": "Login successful"}.
# curl -X POST http://localhost:8000/login/ -d "username=admin" -d "password=password"
# {"message": "Login successful"}.
# http://localhost:8000/login/?
# 422
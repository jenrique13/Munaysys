import requests
token = requests.post('http://localhost:8000/api/v1/auth/login', data={'username':'admin3@munaysys.com', 'password':'admin'}).json().get('access_token')
print(requests.get('http://localhost:8000/api/v1/configuration/branches', headers={'Authorization': f'Bearer {token}'}).text)

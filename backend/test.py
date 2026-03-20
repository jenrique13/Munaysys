import requests

try:
    token_res = requests.post('http://localhost:8000/api/v1/auth/login', data={'username':'admin3@munaysys.com', 'password':'admin'})
    if not token_res.ok:
        print('Login failed:', token_res.text)
        exit(1)
        
    token = token_res.json().get('access_token')
    
    res = requests.post(
        'http://localhost:8000/api/v1/configuration/branches', 
        json={'name': 'Test Branch', 'address': '123'}, 
        headers={'Authorization': f'Bearer {token}'}
    )
    
    print('Status:', res.status_code)
    print('Response:', res.text)
except Exception as e:
    print('Exception:', e)

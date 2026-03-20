import urllib.request
import json

BASE_URL = "http://localhost:8000/api/v1"

def debug_api(endpoint, params=None):
    url = f"{BASE_URL}{endpoint}"
    if params:
        query = urllib.parse.urlencode(params)
        url = f"{url}?{query}"
    
    print(f"\n--- Testing {url} ---")
    try:
        with urllib.request.urlopen(url) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Status Code: {status}")
            try:
                print(f"Response Body: {json.dumps(json.loads(body), indent=2)}")
            except:
                print(f"Response Text: {body}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(f"Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api("/crm/stages", params={"branch_id": 0})
    debug_api("/crm/opportunities", params={"branch_id": 0})
    debug_api("/crm/leads", params={"branch_id": 0})

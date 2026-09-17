import requests
resp = requests.get("http://localhost:8000/api/audio?page=1&page_size=2")
import json
data = resp.json()
for item in data['items']:
    print(json.dumps(item, indent=2))

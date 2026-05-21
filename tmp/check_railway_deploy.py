import json, urllib.request

# Check latest commits for Railway deploy status
url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/commits/5f93af3/status"
data = json.load(urllib.request.urlopen(url))
print(f"State: {data.get('state')}")
for s in data.get('statuses', []):
    print(f"  {s['context']}: {s['state']} - {s.get('description','')[:100]}")

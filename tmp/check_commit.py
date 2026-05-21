import json, urllib.request

# Get combined status for latest commit
url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/commits/585d655/status"
data = json.load(urllib.request.urlopen(url))
print(f"State: {data.get('state')}")
print(f"Total count: {data.get('total_count')}")
for s in data.get('statuses', []):
    print(f"  {s['context']}: {s['state']} - {s.get('description','')}")

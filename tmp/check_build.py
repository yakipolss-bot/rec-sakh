import json, urllib.request

# Get detailed info about the failed Railway deployment
url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/commits/585d655/check-runs"
data = json.load(urllib.request.urlopen(url))
for cr in data.get('check_runs', []):
    print(f"{cr['name']}: {cr['status']} - {cr['conclusion']}")
    if cr.get('output', {}).get('title'):
        print(f"  Title: {cr['output']['title']}")
    if cr.get('output', {}).get('summary'):
        print(f"  Summary: {cr['output']['summary'][:200]}")

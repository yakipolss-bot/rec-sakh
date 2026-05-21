import json, urllib.request

url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/commits/98023d8/status"
data = json.load(urllib.request.urlopen(url))
for s in data.get('statuses', []):
    if 'Vercel' in s['context'] or 'railway' in s['context'].lower():
        print(f"{s['context']}: {s['state']} - {s.get('description','')[:80]}")

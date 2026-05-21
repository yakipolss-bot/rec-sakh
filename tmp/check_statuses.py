import json, urllib.request

url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/commits/585d655/statuses"
data = json.load(urllib.request.urlopen(url))
for s in data:
    print(f"{s['context']}: {s['state']}")

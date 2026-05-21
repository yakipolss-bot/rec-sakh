import json, urllib.request

url = "https://api.github.com/repos/yakipolss-bot/rec-sakh/actions/runs/26214097984/jobs"
req = urllib.request.Request(url, headers={"Accept": "application/vnd.github.v3+json"})
data = json.load(urllib.request.urlopen(req))
for j in data.get("jobs", []):
    print(f"{j['name']}: {j['status']} - {j['conclusion']}")
    for s in j.get("steps", []):
        if s.get("conclusion") == "failure":
            print(f"  FAILED: {s['name']}")

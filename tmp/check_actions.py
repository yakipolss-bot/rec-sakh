import json
d = json.load(open('tmp/gh_actions.json'))
for r in d.get('workflow_runs', []):
    print(f"{r['id']}: {r['name']} - {r['status']} - {r['conclusion']}")

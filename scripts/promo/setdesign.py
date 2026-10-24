"""Emulator-only helper (writes site/settings.design in the local Firestore emulator): python setdesign.py style=sql projects=carousel skills=rings accent=#2f81f7"""
import json, sys, urllib.request

BASE = "http://127.0.0.1:8080/v1/projects/demo-portfolio/databases/(default)/documents/site/settings"
LAYOUT_KEYS = {"hero", "skills", "projects", "experience", "certificates", "education", "testimonials", "blog"}

req = urllib.request.Request(BASE, headers={"Authorization": "Bearer owner"})
doc = json.load(urllib.request.urlopen(req))
DEFAULT = {"style": "classic", "background": "auto", "motion": "smooth", "speed": "normal", "density": "normal"}
LAYOUT_DEFAULTS = {"hero": "split", "skills": "cards", "projects": "grid", "experience": "timeline", "certificates": "grid", "education": "cards", "testimonials": "carousel", "blog": "grid"}
if "design" in doc["fields"]:
    design = doc["fields"]["design"]["mapValue"]["fields"]
else:
    design = {k: {"stringValue": v} for k, v in DEFAULT.items()}
    design["layouts"] = {"mapValue": {"fields": {k: {"stringValue": v} for k, v in LAYOUT_DEFAULTS.items()}}}
    design["order"] = {"arrayValue": {"values": [{"stringValue": x} for x in ["skills", "projects", "experience", "certificates", "education", "testimonials", "blog"]]}}
accent = None
for arg in sys.argv[1:]:
    k, v = arg.split("=", 1)
    if k == "accent":
        accent = v
    elif k in LAYOUT_KEYS:
        design["layouts"]["mapValue"]["fields"][k] = {"stringValue": v}
    elif k == "order":
        design["order"] = {"arrayValue": {"values": [{"stringValue": x} for x in v.split(",")]}}
    else:
        design[k] = {"stringValue": v}

fields = {"design": {"mapValue": {"fields": design}}}
mask = "updateMask.fieldPaths=design"
if accent:
    fields["accentColor"] = {"stringValue": accent}
    mask += "&updateMask.fieldPaths=accentColor"
body = json.dumps({"fields": fields}).encode()
req = urllib.request.Request(BASE + "?" + mask, data=body, method="PATCH", headers={"Authorization": "Bearer owner", "Content-Type": "application/json"})
urllib.request.urlopen(req)
print("ok", " ".join(sys.argv[1:]))

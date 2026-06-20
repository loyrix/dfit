import json
import re
import base64
import os

log_file = "/Users/satyamjaiswal/.gemini/antigravity-ide/brain/ab814cb6-a608-4cbd-b4da-92348eee0e92/.system_generated/logs/transcript.jsonl"
target_msg = ""

with open(log_file, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                content = data.get("content", "")
                if "camera icon  svg" in content and "sheild icon" in content:
                    target_msg = content
                    break
        except:
            continue

if target_msg:
    # Find base64 strings
    matches = re.findall(r'xlink:href="data:image/png;base64,([^"]+)"', target_msg)
    if len(matches) >= 2:
        # Save camera (first match)
        with open('apps/mobile/assets/icons/camera.png', 'wb') as f:
            f.write(base64.b64decode(matches[0]))
        # Save shield (second match)
        with open('apps/mobile/assets/icons/shield.png', 'wb') as f:
            f.write(base64.b64decode(matches[1]))
        print("Successfully extracted and saved camera.png and shield.png")
    else:
        print("Found message but not enough base64 matches:", len(matches))
else:
    print("Could not find the target message in transcript.")

import os

lib_dir = '/Users/satyamjaiswal/Documents/New project/apps/mobile/lib'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    changed = False
    
    # fix imports
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'premium_button.dart' in line and not line.strip().startswith('//'):
            if line.strip() != "import 'package:logmyplate_mobile/src/widgets/premium_button.dart';":
                lines[i] = "import 'package:logmyplate_mobile/src/widgets/premium_button.dart';"
                changed = True

    if changed:
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
        print(f"Fixed imports in {filepath}")

for root, _, files in os.walk(lib_dir):
    for f in files:
        if f.endswith('.dart'):
            process_file(os.path.join(root, f))

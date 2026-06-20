import os

def add_import_to_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'GlassWrapper(' in content and 'glass_wrapper.dart' not in content:
        # insert after the first import or at top
        import_stmt = "import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';\n"
        
        # find last import to insert after
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import_idx = i
                
        if last_import_idx != -1:
            lines.insert(last_import_idx + 1, import_stmt.strip())
        else:
            lines.insert(0, import_stmt.strip())
            
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))

for root, dirs, files in os.walk('apps/mobile/lib'):
    for file in files:
        if file.endswith('.dart'):
            add_import_to_file(os.path.join(root, file))

print("Imports added")

import os
import re

def wrap_buttons_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    button_types = ['OutlinedButton', 'OutlinedButton.icon']
    
    modified = False
    
    for btype in button_types:
        start_idx = 0
        while True:
            match = re.search(r'\b' + re.escape(btype) + r'\s*\(', content[start_idx:])
            if not match:
                break
                
            match_start = start_idx + match.start()
            match_end = start_idx + match.end()
            
            # Check if it's already wrapped
            prefix = content[max(0, match_start-20):match_start]
            if 'GlassWrapper(child:' in prefix.replace(' ', ''):
                start_idx = match_end
                continue
                
            # Find matching closing parenthesis
            open_parens = 1
            idx = match_end
            while idx < len(content) and open_parens > 0:
                if content[idx] == '(':
                    open_parens += 1
                elif content[idx] == ')':
                    open_parens -= 1
                idx += 1
                
            if open_parens == 0:
                end_idx = idx
                content = content[:match_start] + f"GlassWrapper(child: {content[match_start:end_idx]})" + content[end_idx:]
                modified = True
                start_idx = match_start + len(f"GlassWrapper(child: ") + (end_idx - match_start) + 1
            else:
                start_idx = match_end

    if modified:
        import_stmt = "import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';\n"
        if 'glass_wrapper.dart' not in content:
            lines = content.split('\n')
            last_import_idx = -1
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
                    
            if last_import_idx != -1:
                lines.insert(last_import_idx + 1, import_stmt.strip())
            else:
                lines.insert(0, import_stmt.strip())
                
            content = '\n'.join(lines)
            
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('apps/mobile/lib'):
    for file in files:
        if file.endswith('.dart'):
            wrap_buttons_in_file(os.path.join(root, file))

print("OutlinedButtons wrapped")

import os
import re

lib_dir = '/Users/satyamjaiswal/Documents/New project/apps/mobile/lib'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'FilledButton' not in content:
        return

    original = content

    # Keep replacing style: FilledButton.styleFrom(...)
    while 'style: FilledButton.styleFrom(' in content:
        start_idx = content.find('style: FilledButton.styleFrom(')
        
        open_parens = 1
        end_idx = -1
        # Start looking right after the '(' of styleFrom(
        search_start = start_idx + len('style: FilledButton.styleFrom(')
        
        for i in range(search_start, len(content)):
            if content[i] == '(':
                open_parens += 1
            elif content[i] == ')':
                open_parens -= 1
                if open_parens == 0:
                    end_idx = i
                    break
        
        if end_idx != -1:
            # find comma
            comma_idx = end_idx + 1
            while comma_idx < len(content) and content[comma_idx] in [' ', '\n', '\t']:
                comma_idx += 1
            if comma_idx < len(content) and content[comma_idx] == ',':
                end_idx = comma_idx
                
            content = content[:start_idx] + content[end_idx+1:]
        else:
            break

    content = content.replace('FilledButton(', 'PremiumButton(')
    content = content.replace('FilledButton.icon(', 'PremiumButton.icon(')
    
    if original != content:
        if 'premium_button.dart' not in content:
            rel_path = os.path.relpath(filepath, lib_dir)
            depth = rel_path.count('/')
            prefix = '../' * depth if depth > 0 else './'
            if 'src/widgets/' in filepath:
                 import_statement = "import 'premium_button.dart';\n"
            else:
                 import_statement = f"import '{prefix}widgets/premium_button.dart';\n"
            
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    lines.insert(i, import_statement.strip())
                    content = '\n'.join(lines)
                    break
                    
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(lib_dir):
    for f in files:
        if f.endswith('.dart'):
            process_file(os.path.join(root, f))

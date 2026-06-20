import os
import re

def wrap_buttons_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all occurrences of TextButton or ElevatedButton
    # We will use a simple state machine to find the matching closing parenthesis.
    
    button_types = ['TextButton', 'TextButton.icon', 'ElevatedButton', 'ElevatedButton.icon']
    
    modified = False
    
    for btype in button_types:
        start_idx = 0
        while True:
            # Look for the button type not already preceded by 'child: '
            # Actually, to avoid double wrapping, we can check if it's already wrapped.
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
                # We found the end!
                end_idx = idx
                # Replace content
                content = content[:match_start] + f"GlassWrapper(child: {content[match_start:end_idx]})" + content[end_idx:]
                modified = True
                start_idx = match_start + len(f"GlassWrapper(child: ") + (end_idx - match_start) + 1
            else:
                start_idx = match_end

    if modified:
        # Add import if needed
        import_stmt = "import '../widgets/glass/glass_wrapper.dart';\n"
        if import_stmt not in content and 'glass_wrapper.dart' not in content:
            # find first import
            import_match = re.search(r'^import .*;', content, re.MULTILINE)
            if import_match:
                # To be safe, we need the correct relative path. 
                # Let's just use absolute package import if possible, or calculate relative.
                pass
        
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('apps/mobile/lib'):
    for file in files:
        if file.endswith('.dart'):
            wrap_buttons_in_file(os.path.join(root, file))

print("Done")

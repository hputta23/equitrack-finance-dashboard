import os
import re

screens_dir = '/Users/putta/.gemini/antigravity/scratch/blueprint-finance-dashboard/stitch_screens'
pages_dir = '/Users/putta/.gemini/antigravity/scratch/blueprint-finance-dashboard/src/pages'
app_tsx_path = '/Users/putta/.gemini/antigravity/scratch/blueprint-finance-dashboard/src/App.tsx'

if not os.path.exists(pages_dir):
    os.makedirs(pages_dir)

def convert_style_to_jsx(style_str):
    # Very basic style to JSX object conversion
    # E.g. "clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%); transform: rotate(45deg);"
    # -> {{ clipPath: 'polygon(...)', transform: 'rotate(45deg)' }}
    props = style_str.split(';')
    jsx_props = []
    for prop in props:
        if not prop.strip(): continue
        parts = prop.split(':', 1)
        if len(parts) == 2:
            key = parts[0].strip()
            # camelCase key
            key_parts = key.split('-')
            key = key_parts[0] + ''.join(word.capitalize() for word in key_parts[1:])
            val = parts[1].strip()
            # Handle quotes safely
            val = val.replace("'", "\\'")
            jsx_props.append(f"{key}: '{val}'")
    
    if not jsx_props:
        return ""
    return "{{ " + ", ".join(jsx_props) + " }}"

def style_replace(match):
    style_content = match.group(1)
    jsx_style = convert_style_to_jsx(style_content)
    return f'style={jsx_style}'

def convert_html_to_jsx(html):
    # Extract body content
    body_match = re.search(r'<body[^>]*>(.*)</body>', html, re.DOTALL | re.IGNORECASE)
    if not body_match:
        return ""
    
    content = body_match.group(1)
    
    # 1. class -> className
    content = content.replace('class="', 'className="')
    content = content.replace("class='", "className='")
    
    # 2. for -> htmlFor
    content = content.replace('for="', 'htmlFor="')
    
    # 3. Handle SVG attributes
    content = content.replace('viewBox', 'viewBox') # already camel
    content = content.replace('viewbox="', 'viewBox="')
    content = content.replace('stroke-width="', 'strokeWidth="')
    content = content.replace('stroke-linecap="', 'strokeLinecap="')
    content = content.replace('stroke-linejoin="', 'strokeLinejoin="')
    content = content.replace('fill-rule="', 'fillRule="')
    content = content.replace('clip-rule="', 'clipRule="')
    content = content.replace('patternunits="', 'patternUnits="')
    content = content.replace('patternUnits="', 'patternUnits="')
    
    # 4. Self-closing tags (only void elements)
    content = re.sub(r'<(input|img|br|hr)([^>]*?)(?<!/)>', r'<\1\2 />', content)
    
    # 5. Inline styles
    content = re.sub(r'style="([^"]*)"', style_replace, content)
    
    # 6. HTML comments -> JSX comments
    content = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', content, flags=re.DOTALL)
    
    # 7. Additional SVG/JSX specific attribute fixes
    content = content.replace('stroke-dasharray="', 'strokeDasharray="')
    content = content.replace('stroke-dashoffset="', 'strokeDashoffset="')
    content = content.replace('preserveaspectratio="', 'preserveAspectRatio="')
    
    # 8. Boolean and numeric attributes for React TypeScript
    content = content.replace('checked=""', 'checked')
    content = content.replace('disabled=""', 'disabled')
    content = content.replace('selected=""', 'selected')
    content = re.sub(r'rows="(\d+)"', r'rows={\1}', content)
    
    return content.strip()

# Generate React components
routes = []
imports = []

for filename in os.listdir(screens_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(screens_dir, filename)
        with open(filepath, 'r') as f:
            html_content = f.read()
        
        jsx_content = convert_html_to_jsx(html_content)
        
        # Clean up filename for component name
        component_name = filename.replace('.html', '').replace('-', '_').replace('&', 'And')
        # Remove trailing ID (last 32 chars)
        parts = component_name.split('_')
        if len(parts[-1]) >= 32:
            component_name = ''.join(word.capitalize() for word in parts[:-1])
        else:
            component_name = ''.join(word.capitalize() for word in parts)
            
        # Ensure valid component name
        component_name = re.sub(r'[^a-zA-Z0-9]', '', component_name)
        if component_name[0].isdigit():
            component_name = "Screen" + component_name
            
        # Write .tsx file
        tsx_filepath = os.path.join(pages_dir, f"{component_name}.tsx")
        
        tsx_code = f"""export default function {component_name}() {{
  return (
    <>
      {{/* Wrapper to ensure full screen rendering */}}
      <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden">
        {jsx_content}
      </div>
    </>
  );
}}
"""
        with open(tsx_filepath, 'w') as f:
            f.write(tsx_code)
        
        print(f"Generated {component_name}.tsx")
        
        route_path = '/' + component_name.lower().replace('screen', '')
        if component_name == 'FinancialDashboard' or component_name == 'FinancialDashboardCommandCenter':
            route_path = '/' # Let's not overwrite the main dashboard immediately, wait, we will.
        
        imports.append(f"import {component_name} from './pages/{component_name}';")
        routes.append(f'          <Route path="{route_path}" element={{<{component_name} />}} />')

# Build App.tsx
app_code = f"""import {{ BrowserRouter as Router, Routes, Route, Link }} from 'react-router-dom';
{chr(10).join(set(imports))}

function Navigation() {{
  return (
    <div className="bg-surface-container border-b border-outline-variant p-4 flex gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
      <Link to="/" className="text-primary hover:text-primary-container font-bold text-sm">Dashboard</Link>
      <span className="text-outline">|</span>
      {chr(10).join([f'      <Link to="{r.split(chr(34))[1]}" className="text-on-surface-variant hover:text-on-surface text-sm">{r.split("element={<")[1].split(" ")[0]}</Link>' for r in routes if 'path="/"' not in r and "element={<" in r])}
    </div>
  );
}}

function App() {{
  return (
    <Router>
      <div className="dark h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 overflow-auto">
          <Routes>
{chr(10).join(routes)}
            <Route path="/" element={{<FinancialDashboard />}} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}}

export default App;
"""

with open(app_tsx_path, 'w') as f:
    f.write(app_code)

print("Generated App.tsx routing!")

#!/bin/sh

echo "Fixing import paths in TypeScript files..."

# Check if node is available
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required but not installed."
  exit 1
fi

# Check if fix-paths.js exists
if [ -f "fix-paths.js" ]; then
  echo "Running fix-paths.js..."
  node fix-paths.js
  echo "Import paths fixed!"
else
  echo "Warning: fix-paths.js not found. Creating a basic version..."
  
  # Create a basic fix-paths.js file
  cat > fix-paths.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Function to recursively get all TypeScript files
function getTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getTypeScriptFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports that should be absolute
  const relativeImportRegex = /import\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"](\.\.[\/\\][^'"]*)['"]/g;
  let match;
  
  while ((match = relativeImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip if it's a node_modules import
    if (importPath.includes('node_modules')) {
      continue;
    }
    
    // Convert to absolute import if it goes up multiple levels
    if (importPath.startsWith('../..')) {
      const absolutePath = '@/' + importPath.split('/').slice(2).join('/');
      const newImport = match[0].replace(importPath, absolutePath);
      content = content.replace(match[0], newImport);
      modified = true;
      console.log(`  Fixed: ${match[0]} -> ${newImport}`);
    }
  }
  
  // Fix absolute imports that don't use @
  const absoluteImportRegex = /import\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"]([\/\\][^'"]*)['"]/g;
  
  while ((match = absoluteImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip if it's a node_modules import
    if (importPath.includes('node_modules')) {
      continue;
    }
    
    // Convert to @ import
    const absolutePath = '@' + importPath;
    const newImport = match[0].replace(importPath, absolutePath);
    content = content.replace(match[0], newImport);
    modified = true;
    console.log(`  Fixed: ${match[0]} -> ${newImport}`);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
  }
}

// Main function
function main() {
  try {
    // Check if src directory exists
    if (!fs.existsSync('src')) {
      console.error('Error: src directory not found!');
      process.exit(1);
    }
    
    // Get all TypeScript files
    const files = getTypeScriptFiles('src');
    console.log(`Found ${files.length} TypeScript files`);
    
    // Fix imports in each file
    files.forEach(fixImportsInFile);
    
    console.log('Import paths fixed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
EOF
  
  echo "Created fix-paths.js"
  
  # Run the script
  node fix-paths.js
  echo "Import paths fixed!"
fi

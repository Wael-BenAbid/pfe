#!/bin/sh

echo "Starting App.tsx fixes..."

# Check if App.tsx exists
if [ -f "src/App.tsx" ]; then
  # Update import for ResetPassword
  sed -i 's|import ResetPassword from "./pages/ResetPassword";|import ResetPassword from "./ResetPassword";|g' src/App.tsx
  sed -i 's|import ResetPassword from "./pages/ResetPassword"|import ResetPassword from "./ResetPassword"|g' src/App.tsx
  echo "Updated ResetPassword import in App.tsx"
else
  echo "App.tsx not found in src directory"
fi

# Create a backup of App.tsx if it doesn't exist
if [ ! -f "src/App.tsx.backup" ] && [ -f "src/App.tsx" ]; then
  cp src/App.tsx src/App.tsx.backup
  echo "Created backup of App.tsx"
fi

echo "App.tsx fixes completed!"

#!/bin/sh

echo "Starting path fixes..."

# Fix image paths in ResetPassword.tsx and ForgotPassword.tsx
if [ -f "src/pages/ResetPassword.tsx" ]; then
  sed -i 's|"../assets/images/logo.png"|"../../assets/images/logo.png"|g' src/pages/ResetPassword.tsx
  echo "Fixed image path in ResetPassword.tsx"
else
  echo "ResetPassword.tsx not found in src/pages"
fi

if [ -f "src/pages/ForgotPassword.tsx" ]; then
  sed -i 's|"../assets/images/logo.png"|"../../assets/images/logo.png"|g' src/pages/ForgotPassword.tsx
  echo "Fixed image path in ForgotPassword.tsx"
else
  echo "ForgotPassword.tsx not found in src/pages"
fi

# Create a copy of ResetPassword.tsx in the src directory
if [ -f "src/pages/ResetPassword.tsx" ]; then
  cp src/pages/ResetPassword.tsx src/

  # Update imports in the copied file
  sed -i 's|"../components/ui/Button"|"./components/ui/Button"|g' src/ResetPassword.tsx
  sed -i 's|"../components/ui/FormElements"|"./components/ui/FormElements"|g' src/ResetPassword.tsx
  sed -i 's|"../config/constants"|"./config/constants"|g' src/ResetPassword.tsx
  sed -i 's|"../../assets/images/logo.png"|"./assets/images/logo.png"|g' src/ResetPassword.tsx

  echo "Created copy of ResetPassword.tsx in src directory with updated imports"
fi

# Update App.tsx to import from the new location
if [ -f "src/App.tsx" ]; then
  sed -i 's|from "./pages/ResetPassword"|from "./ResetPassword"|g' src/App.tsx
  echo "Updated import in App.tsx"
else
  echo "App.tsx not found in src directory"
fi

# List files to verify changes
echo "Files with logo.png references:"
find src -name "*.tsx" | xargs grep -l "assets/images/logo.png" || echo "No files found with logo.png references"

echo "Path fixes completed successfully!"

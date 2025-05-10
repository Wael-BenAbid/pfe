import fs from 'fs';
import path from 'path';

console.log('Starting path fixes...');

// Fix image paths in ResetPassword.tsx and ForgotPassword.tsx
try {
  // Fix ResetPassword.tsx
  const resetPasswordPath = path.resolve('src/pages/ResetPassword.tsx');
  if (fs.existsSync(resetPasswordPath)) {
    let content = fs.readFileSync(resetPasswordPath, 'utf8');
    content = content.replace(/"..\/assets\/images\/logo.png"/g, '"../../assets/images/logo.png"');
    fs.writeFileSync(resetPasswordPath, content);
    console.log('Fixed image path in ResetPassword.tsx');
  } else {
    console.log('ResetPassword.tsx not found in src/pages');
  }

  // Fix ForgotPassword.tsx
  const forgotPasswordPath = path.resolve('src/pages/ForgotPassword.tsx');
  if (fs.existsSync(forgotPasswordPath)) {
    let content = fs.readFileSync(forgotPasswordPath, 'utf8');
    content = content.replace(/"..\/assets\/images\/logo.png"/g, '"../../assets/images/logo.png"');
    fs.writeFileSync(forgotPasswordPath, content);
    console.log('Fixed image path in ForgotPassword.tsx');
  } else {
    console.log('ForgotPassword.tsx not found in src/pages');
  }

  // Create a copy of ResetPassword.tsx in the src directory
  if (fs.existsSync(resetPasswordPath)) {
    let content = fs.readFileSync(resetPasswordPath, 'utf8');
    
    // Update imports in the copied file
    content = content.replace(/"..\/components\/ui\/Button"/g, '"./components/ui/Button"');
    content = content.replace(/"..\/components\/ui\/FormElements"/g, '"./components/ui/FormElements"');
    content = content.replace(/"..\/config\/constants"/g, '"./config/constants"');
    content = content.replace(/"..\/..\/assets\/images\/logo.png"/g, '"./assets/images/logo.png"');
    
    fs.writeFileSync(path.resolve('src/ResetPassword.tsx'), content);
    console.log('Created copy of ResetPassword.tsx in src directory with updated imports');
  }

  // Update App.tsx to import from the new location
  const appPath = path.resolve('src/App.tsx');
  if (fs.existsSync(appPath)) {
    let content = fs.readFileSync(appPath, 'utf8');
    content = content.replace(/from ['"]\.\/pages\/ResetPassword['"]/g, 'from "./ResetPassword"');
    fs.writeFileSync(appPath, content);
    console.log('Updated import in App.tsx');
  } else {
    console.log('App.tsx not found in src directory');
  }

  console.log('Path fixes completed successfully!');
} catch (error) {
  console.error('Error fixing paths:', error);
  process.exit(1);
}

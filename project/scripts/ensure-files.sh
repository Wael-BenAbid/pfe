#!/bin/sh

echo "Ensuring all required files exist..."

# Check if ResetPassword.tsx exists in pages directory
if [ ! -f "src/pages/ResetPassword.tsx" ]; then
  echo "ResetPassword.tsx not found in src/pages, creating it..."
  
  # Create the directory if it doesn't exist
  mkdir -p src/pages
  
  # Create a basic ResetPassword.tsx file
  cat > src/pages/ResetPassword.tsx << 'EOF'
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import { TextInput } from "@/components/ui/FormElements";
import { API_BASE_URL } from "@/config/constants";
import { LockIcon } from "lucide-react";
import logoImage from "@/assets/images/logo.png";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset successful. You can now login with your new password.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.detail || "Password reset failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/">
            <img src={logoImage} alt="Logo" className="h-16 mx-auto mb-2" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600">Enter your new password below</p>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <TextInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<LockIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Enter your new password"
            />
          </div>
          
          <div className="mb-6">
            <TextInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              icon={<LockIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Confirm your new password"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
EOF
  
  echo "Created ResetPassword.tsx in src/pages"
fi

# Check if ResetPassword.tsx exists in src directory
if [ ! -f "src/ResetPassword.tsx" ]; then
  echo "ResetPassword.tsx not found in src, creating it..."
  
  # Copy from pages directory if it exists, otherwise create it
  if [ -f "src/pages/ResetPassword.tsx" ]; then
    cp src/pages/ResetPassword.tsx src/
    echo "Copied ResetPassword.tsx from src/pages to src"
  else
    # Create a basic ResetPassword.tsx file with the same content as above
    cat > src/ResetPassword.tsx << 'EOF'
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import { TextInput } from "@/components/ui/FormElements";
import { API_BASE_URL } from "@/config/constants";
import { LockIcon } from "lucide-react";
import logoImage from "@/assets/images/logo.png";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Password reset successful. You can now login with your new password.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.detail || "Password reset failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/">
            <img src={logoImage} alt="Logo" className="h-16 mx-auto mb-2" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600">Enter your new password below</p>
        </div>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <TextInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<LockIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Enter your new password"
            />
          </div>
          
          <div className="mb-6">
            <TextInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              icon={<LockIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Confirm your new password"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
EOF
    
    echo "Created ResetPassword.tsx in src"
  fi
fi

echo "All required files exist!"

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { TextInput } from "../../components/ui/FormElements";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { UserIcon, Eye, EyeOff } from "lucide-react";
import logoImage from "../../assets/images/logo.png";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    // Stocker l'email utilisé pour la connexion
    // Si c'est un email, le stocker directement
    if (username.includes('@')) {
      localStorage.setItem('last_login_email', username);
      console.log("Stored login email:", username);
    } else {
      // Si c'est un nom d'utilisateur, ne pas le stocker pour la vérification de candidature
      console.log("Username provided, not storing for pending application check");
    }

    try {
      await login(username, password);

      // Assume the response contains the user type, or you can fetch it after login
      const userType = localStorage.getItem("user_type");
      if (userType === "admin") {
        navigate("/admine");
      } else if (userType === "employee") {
        navigate("/employee");
      } else if (userType === "intern") {
        navigate("/intern");
      } else {
        navigate(from);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        console.log("Error message:", error.message);

        console.log("Processing error message:", error.message);

        if (error.message.includes("credentials")) {
          setErrorMessage("Invalid username or password");
        } else if (error.message.startsWith("pending:")) {
          // Extraire l'ID de l'application
          const applicationId = error.message.split(":")[1];
          console.log("Redirecting to pending approval page with ID:", applicationId);
          setErrorMessage("Your application is pending approval");

          // Utiliser setTimeout pour s'assurer que la redirection se produit après le rendu
          setTimeout(() => {
            navigate("/pending-approval", {
              state: { applicationId }
            });
          }, 100);
        } else if (error.message === "rejected") {
          console.log("Redirecting to application rejected page");
          setErrorMessage("Your application has been rejected");

          // Utiliser setTimeout pour s'assurer que la redirection se produit après le rendu
          setTimeout(() => {
            navigate("/application-rejected", { replace: true });
          }, 100);
        } else if (error.message.includes("en attente")) {
          // Cas où le message contient "en attente" mais pas d'ID
          console.log("Application pending detected from message");
          setErrorMessage("Your application is pending approval");

          // Utiliser setTimeout pour s'assurer que la redirection se produit après le rendu
          setTimeout(() => {
            navigate("/pending-approval");
          }, 100);
        } else if (error.message === "pending") {
          // Cas simple où le message est juste "pending"
          console.log("Simple pending status detected");
          setErrorMessage("Your application is pending approval");

          // Utiliser setTimeout pour s'assurer que la redirection se produit après le rendu
          setTimeout(() => {
            navigate("/pending-approval");
          }, 100);
        } else {
          console.log("Generic error:", error.message);
          setErrorMessage(error.message || "An error occurred. Please try again.");
        }
      } else {
        console.log("Non-Error object thrown:", error);
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Link to="/">
            <img src={logoImage} alt="RH Management" className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use your email address to sign in
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/apply"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            submit a new application
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errorMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <TextInput
              label="Email or Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email address"
              helper="You can use either your email or username to log in"
            />

            <div className="relative">
              <TextInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

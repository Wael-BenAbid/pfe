import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, LogIn, Briefcase as BriefcaseIcon } from "lucide-react";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Logo size="lg" showText={true} textClassName="text-xl" />
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Login
                </Button>
              </Link>
              <Link to="/apply">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-4xl w-full space-y-8 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              Welcome to Our <span className="text-blue-600">RH Management System</span>
            </h1>
            <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
              Join our team and be part of something great. We offer exciting
              opportunities for both full-time positions and internships.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up-delay">
            <Link to="/apply" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<UserPlus className="h-5 w-5" />}
                className="transform transition-all hover:scale-105"
              >
                Submit Application
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                icon={<LogIn className="h-5 w-5" />}
                className="transform transition-all hover:scale-105"
              >
                Employee Login
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up-delay-2">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 mx-auto bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Career Growth
              </h3>
              <p className="mt-2 text-gray-500">
                Opportunities for professional development and advancement
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 mx-auto bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Easy Application
              </h3>
              <p className="mt-2 text-gray-500">
                Simple and streamlined application process
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="h-12 w-12 mx-auto bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <LogIn className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Employee Portal
              </h3>
              <p className="mt-2 text-gray-500">
                Secure access to employee resources and tools
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

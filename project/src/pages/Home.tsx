import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, LogIn, Briefcase as BriefcaseIcon, Users, Award, Heart } from "lucide-react";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import Footer from "../components/ui/Footer";
import AnimatedBackground from "../components/ui/AnimatedBackground";

const Home: React.FC = () => {
  // Company information for the footer
  const companyInfo = {
    address: "Rue Asdrubal, Montplaisir, Tunis, Tunisie",
    phone: "+216 71 123 456",
    email: "contact@tunisietelecom.tn",
    website: "www.tunisietelecom.tn"
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col">
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
                Welcome to Our <span className="text-blue-600">HR Management System</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
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
                  className="transform transition-all hover:scale-105 animate-pulse-blue"
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
                  Login
                </Button>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up-delay-2">
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all animate-float">
                <div className="h-12 w-12 mx-auto bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Career Growth
                </h3>
                <p className="mt-2 text-gray-600">
                  Opportunities for professional development and advancement
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all animate-float" style={{ animationDelay: '0.2s' }}>
                <div className="h-12 w-12 mx-auto bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Collaborative Environment
                </h3>
                <p className="mt-2 text-gray-600">
                  Work with talented professionals in a supportive team
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-all animate-float" style={{ animationDelay: '0.4s' }}>
                <div className="h-12 w-12 mx-auto bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Recognition & Rewards
                </h3>
                <p className="mt-2 text-gray-600">
                  Your contributions are valued and recognized
                </p>
              </div>
            </div>

            {/* Additional Features */}
            <div className="mt-12 bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-sm animate-scale-in" style={{ animationDelay: '0.8s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join Our Team?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start animate-slide-in" style={{ animationDelay: '0.9s' }}>
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Work-Life Balance</h3>
                    <p className="mt-1 text-gray-600">We value your personal time and well-being</p>
                  </div>
                </div>
                <div className="flex items-start animate-slide-in" style={{ animationDelay: '1.0s' }}>
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Competitive Benefits</h3>
                    <p className="mt-1 text-gray-600">Comprehensive benefits package for you and your family</p>
                  </div>
                </div>
                <div className="flex items-start animate-slide-in" style={{ animationDelay: '1.1s' }}>
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <BriefcaseIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Meaningful Work</h3>
                    <p className="mt-1 text-gray-600">Make an impact with projects that matter</p>
                  </div>
                </div>
                <div className="flex items-start animate-slide-in" style={{ animationDelay: '1.2s' }}>
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Inclusive Culture</h3>
                    <p className="mt-1 text-gray-600">Diverse perspectives are welcomed and valued</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Team Section with RH MANGMENT Logo */}
            <div className="mt-12 bg-gradient-to-r from-cyan-500 to-teal-500 p-8 rounded-xl shadow-md animate-scale-in overflow-hidden relative" style={{ animationDelay: '1.3s' }}>
              {/* Animated background waves */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 animate-wave" style={{ borderRadius: '100% 100% 0 0' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/10 animate-wave" style={{ borderRadius: '100% 100% 0 0', animationDelay: '-2s' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/10 animate-wave" style={{ borderRadius: '100% 100% 0 0', animationDelay: '-4s' }}></div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6 text-center relative z-10">Our Team</h2>
              <div className="flex flex-col items-center relative z-10">
                <div className="w-64 h-64 relative group">
                  <img
                    src="/assets/rh-mangment-logo.svg"
                    alt="RH MANGMENT"
                    className="w-full h-full object-contain animate-glow group-hover:animate-bounce-slow transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-teal-500/30 rounded-full blur-xl -z-10 animate-pulse-blue"></div>
                </div>
                <p className="mt-6 text-white text-center max-w-2xl text-lg">
                  Our team of HR professionals is dedicated to creating a positive work environment
                  and helping employees reach their full potential. We believe in fostering a culture
                  of collaboration, innovation, and continuous growth.
                </p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center text-white animate-slide-in hover:bg-white/30 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '1.4s' }}>
                    <p className="font-bold text-xl">15+</p>
                    <p className="text-sm">HR Experts</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center text-white animate-slide-in hover:bg-white/30 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '1.5s' }}>
                    <p className="font-bold text-xl">10+</p>
                    <p className="text-sm">Years Experience</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center text-white animate-slide-in hover:bg-white/30 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '1.6s' }}>
                    <p className="font-bold text-xl">500+</p>
                    <p className="text-sm">Employees Managed</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg text-center text-white animate-slide-in hover:bg-white/30 transition-all duration-300 transform hover:scale-105" style={{ animationDelay: '1.7s' }}>
                    <p className="font-bold text-xl">24/7</p>
                    <p className="text-sm">Support</p>
                  </div>
                </div>

                {/* Call to action button */}
                <button className="mt-8 bg-white text-cyan-600 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-cyan-50 transition-all duration-300 transform hover:scale-105 animate-pulse-blue">
                  Join Our Team Today
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer
          address={companyInfo.address}
          phone={companyInfo.phone}
          email={companyInfo.email}
          website={companyInfo.website}
        />
      </div>
    </AnimatedBackground>
  );
};

export default Home;

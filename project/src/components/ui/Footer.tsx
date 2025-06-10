import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import topnetLogo from '../../assets/images/topnet.png';
import rhLogo from '../../assets/images/logo2.png';

interface FooterProps {
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const Footer: React.FC<FooterProps> = ({
  address = 'Topnet Agence Centre Urbain Nord • Rez-de-chaussée du siège Topnet Centre Urbain Nord,1080',
  phone = '+216 71 111 000',
  email = 'support@topnet.tn',
  website = 'https://www.topnet.tn'
}) => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-white">RH Management</h3>
            </div>
            <p className="text-gray-400 max-w-xs">
              Providing innovative HR solutions to help businesses grow and employees thrive.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <span className="text-gray-300">{address}</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-gray-300">{phone}</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-gray-300">{email}</span>
              </li>
              <li className="flex items-center">
                <Globe className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-gray-300">{website}</span>
              </li>
            </ul>
          </div>

          {/* Partner Logos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nos Partenaires</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Topnet Logo */}
              <div className="bg-white rounded-lg p-2 w-20 h-20 flex items-center justify-center">
                <img
                  src={topnetLogo}
                  alt="Topnet"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* RH Management Logo */}
              <div className="bg-white rounded-lg p-2 w-20 h-20 flex items-center justify-center">
                <img
                  src={rhLogo}
                  alt="RH Management"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Topnet HR Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

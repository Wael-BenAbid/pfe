import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LogOutIcon, ChevronDownIcon } from 'lucide-react';
import { MEDIA_BASE_URL } from '../../config/constants';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  profile_image?: string;
}

interface UserProfileDropdownProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewProfile = () => {
    setIsOpen(false);

    // Redirect to the appropriate profile page based on user type
    if (user?.user_type === 'employee') {
      navigate('/employee/profile');
    } else if (user?.user_type === 'intern') {
      navigate('/intern/profile');
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {user.profile_image ? (
            <img
              src={user.profile_image.startsWith('http') ? user.profile_image : `/media/${user.profile_image}`}
              alt={`${user.first_name || user.username}'s profile`}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-semibold text-sm">
                {user.first_name
                  ? user.first_name.charAt(0)
                  : user.username.charAt(0).toUpperCase()}
                {user.last_name ? user.last_name.charAt(0) : ''}
              </span>
            </div>
          )}
          <div className="ml-2 hidden md:block">
            <p className="text-sm font-medium">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <button
            onClick={handleViewProfile}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            View Profile
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/images/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Composant Logo qui redirige vers la page d'accueil appropriée selon le type d'utilisateur
 * @param size - Taille du logo (sm, md, lg)
 * @param showText - Afficher le texte à côté du logo
 * @param className - Classes CSS supplémentaires pour le conteneur
 * @param textClassName - Classes CSS supplémentaires pour le texte
 */
const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '',
  textClassName = ''
}) => {
  const { user } = useAuth();
  
  // Déterminer la taille du logo
  const logoSizeClass = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto'
  }[size];
  
  // Déterminer l'URL de redirection selon le type d'utilisateur
  let homeUrl = '/';
  let logoText = 'RH Management';
  
  if (user) {
    switch (user.user_type) {
      case 'admin':
        homeUrl = '/admin';
        logoText = 'RH Admin';
        break;
      case 'employee':
        homeUrl = '/employee';
        logoText = 'RH Employee';
        break;
      case 'intern':
        homeUrl = '/intern';
        logoText = 'RH Intern';
        break;
      default:
        homeUrl = '/';
    }
  }
  
  return (
    <Link to={homeUrl} className={`flex items-center ${className}`}>
      <img src={logoImage} alt="RH Management" className={logoSizeClass} />
      {showText && (
        <span className={`ml-2 font-bold ${textClassName || 'text-gray-900'}`}>
          {logoText}
        </span>
      )}
    </Link>
  );
};

export default Logo;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import Button from './Button';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * Composant de bouton de retour réutilisable
 * @param to - URL de destination (si non spécifié, retourne à la page précédente)
 * @param label - Texte du bouton (par défaut: "Retour")
 * @param className - Classes CSS supplémentaires
 */
const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  label = "Retour", 
  className = "" 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Retourne à la page précédente
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      icon={<ArrowLeftIcon className="h-4 w-4" />}
      onClick={handleClick}
      className={className}
    >
      {label}
    </Button>
  );
};

export default BackButton;

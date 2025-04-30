/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Extension de la palette de couleurs
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',  // Couleur principale (bleu)
          600: '#2563eb',  // Bleu plus foncé
        },
        secondary: {
          500: '#64748b',  // Couleur secondaire (gris)
        },
        success: {
          100: '#dcfce7',
          500: '#22c55e',  // Vert pour les succès
        },
        warning: {
          100: '#fef3c7',
          500: '#f59e0b',  // Orange pour les avertissements
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',  // Rouge pour les erreurs
        },
      },
      // Espacements supplémentaires
      spacing: {
        '18': '4.5rem',
        '128': '32rem',    // Pour les modals larges
      },
      // Ombre personnalisée pour les cartes
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.15)',
      },
      // Animation pour les transitions
      transitionDuration: {
        '250': '250ms',
      },
      // Personnalisation des bordures
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),      // Styles de formulaire cohérents
    require('@tailwindcss/typography'),  // Typographie améliorée
    require('@tailwindcss/aspect-ratio'),// Gestion des ratios d'aspect
  ],
  // Sécurité pour les classes dynamiques
  safelist: [
    // Couleurs de fond
    'bg-primary-500',
    'bg-secondary-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-danger-500',
    
    // Couleurs de texte
    'text-primary-500',
    'text-secondary-500',
    'text-success-500',
    'text-warning-500',
    'text-danger-500',
    
    // Bordures
    'border-primary-500',
    'border-secondary-500',
    
    // Pour les badges et indicateurs
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-red-100',
    'bg-purple-100',
    'text-blue-800',
    'text-green-800',
    'text-yellow-800',
    'text-red-800',
    'text-purple-800',
    
    // Grid columns pour les layouts responsives
    'md:grid-cols-2',
    'lg:grid-cols-3',
    'xl:grid-cols-4',
  ],
};
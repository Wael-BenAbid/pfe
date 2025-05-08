/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
        },
        secondary: {
          500: '#64748b',
        },
        success: {
          100: '#dcfce7',
          500: '#22c55e',
        },
        warning: {
          100: '#fef3c7',
          500: '#f59e0b',
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',
        },
      },
      spacing: {
        '18': '4.5rem',
        '128': '32rem',
      },
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
  safelist: [
    'bg-primary-500', 'bg-secondary-500', 'bg-success-500', 'bg-warning-500', 'bg-danger-500',
    'text-primary-500', 'text-secondary-500', 'text-success-500', 'text-warning-500', 'text-danger-500',
    'border-primary-500', 'border-secondary-500',
    'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-red-100', 'bg-purple-100',
    'text-blue-800', 'text-green-800', 'text-yellow-800', 'text-red-800', 'text-purple-800',
    'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4',
  ],
};
#!/usr/bin/env python
"""
Script pour charger les variables d'environnement depuis .env.local
"""

import os
from pathlib import Path

def load_env_file(env_file='.env.local'):
    """Charge les variables d'environnement depuis un fichier"""
    env_path = Path(__file__).parent / env_file
    
    if not env_path.exists():
        print(f"⚠️  Fichier {env_file} non trouvé")
        return
    
    print(f"📁 Chargement des variables depuis {env_file}")
    
    with open(env_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            
            # Ignorer les commentaires et lignes vides
            if not line or line.startswith('#'):
                continue
            
            # Parser la ligne KEY=VALUE
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Supprimer les guillemets si présents
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                
                # Définir la variable d'environnement
                os.environ[key] = value
                print(f"   ✅ {key} = {'***' if 'PASSWORD' in key or 'KEY' in key else value}")
            else:
                print(f"   ⚠️  Ligne {line_num} ignorée: {line}")
    
    print(f"✅ Variables d'environnement chargées depuis {env_file}")

if __name__ == "__main__":
    load_env_file()
    
    # Afficher les variables email pour vérification
    print("\n📧 Configuration Email:")
    email_vars = ['EMAIL_BACKEND', 'EMAIL_PROVIDER', 'EMAIL_HOST', 'EMAIL_PORT', 
                  'EMAIL_USE_TLS', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'DEFAULT_FROM_EMAIL']
    
    for var in email_vars:
        value = os.getenv(var, 'Non défini')
        if 'PASSWORD' in var:
            value = '***' if value != 'Non défini' else 'Non défini'
        print(f"   {var}: {value}")

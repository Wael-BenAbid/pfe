#!/bin/bash

# Script pour appliquer le correctif de la fonctionnalité de chat

# Vérifier si le fichier message_api_fix.py existe
if [ ! -f "message_api_fix.py" ]; then
    echo "Erreur: Le fichier message_api_fix.py n'existe pas."
    exit 1
fi

# Créer le fichier views_message.py dans le répertoire Rh_app
echo "Création du fichier views_message.py..."
cp message_api_fix.py Rh_app/views_message.py

# Mettre à jour le fichier urls.py pour utiliser la nouvelle vue
echo "Mise à jour du fichier urls.py..."
sed -i 's/from .views import (/from .views import (\n    /g' Rh_app/urls.py
sed -i 's/MessageViewSet,//g' Rh_app/urls.py
sed -i 's/from .views import (/from .views import (\n    /g' Rh_app/urls.py
echo "from .views_message import MessageViewSet" >> Rh_app/urls.py

# Supprimer la classe MessageViewSet du fichier views.py
echo "Suppression de la classe MessageViewSet du fichier views.py..."
sed -i '/class MessageViewSet/,/return Response(contact_data)/c\# La classe MessageViewSet a été déplacée vers views_message.py' Rh_app/views.py

echo "Correctif appliqué avec succès!"

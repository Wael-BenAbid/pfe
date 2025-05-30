# Correctif pour les vues de messages du système RH
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
import json

# Import du modèle Message depuis l'application principale
try:
    from Rh_app.models import Message
    from Rh_app.serializers import MessageSerializer
except ImportError:
    # Fallback si le modèle n'existe pas encore
    Message = None
    MessageSerializer = None

class MessageViewSet(viewsets.ViewSet):
    """ViewSet pour gérer les messages du chat avec correctifs"""
    
    def list(self, request):
        """Lister les messages avec pagination"""
        try:
            if Message is None:
                return Response(
                    {'error': 'Modèle Message non disponible'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Récupérer les messages de l'utilisateur connecté
            user = request.user
            if not user.is_authenticated:
                return Response(
                    {'error': 'Utilisateur non authentifié'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Messages envoyés ou reçus par l'utilisateur
            messages = Message.objects.filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('-timestamp')[:50]  # Limiter à 50 messages récents
            
            if MessageSerializer:
                serializer = MessageSerializer(messages, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Fallback sans serializer
                message_data = [
                    {
                        'id': msg.id,
                        'sender': msg.sender.username,
                        'receiver': msg.receiver.username,
                        'content': msg.content,
                        'timestamp': msg.timestamp.isoformat() if hasattr(msg, 'timestamp') else None
                    }
                    for msg in messages
                ]
                return Response(message_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des messages: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Créer un nouveau message avec validation"""
        try:
            if Message is None:
                return Response(
                    {'error': 'Modèle Message non disponible'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            data = request.data
            user = request.user
            
            if not user.is_authenticated:
                return Response(
                    {'error': 'Utilisateur non authentifié'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Validation des données
            receiver_id = data.get('receiver')
            content = data.get('content', '').strip()
            
            if not receiver_id:
                return Response(
                    {'error': 'Destinataire requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not content:
                return Response(
                    {'error': 'Contenu du message requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Destinataire introuvable'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Créer le message
            message = Message.objects.create(
                sender=user,
                receiver=receiver,
                content=content
            )
            
            if MessageSerializer:
                serializer = MessageSerializer(message)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # Fallback sans serializer
                message_data = {
                    'id': message.id,
                    'sender': message.sender.username,
                    'receiver': message.receiver.username,
                    'content': message.content,
                    'timestamp': message.timestamp.isoformat() if hasattr(message, 'timestamp') else None
                }
                return Response(message_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la création du message: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def contacts(self, request):
        """Récupérer la liste des contacts avec correctifs"""
        try:
            user = request.user
            if not user.is_authenticated:
                return Response(
                    {'error': 'Utilisateur non authentifié'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Récupérer tous les utilisateurs actifs sauf l'utilisateur connecté
            users = User.objects.filter(
                is_active=True
            ).exclude(id=user.id).order_by('username')[:20]  # Limiter à 20 contacts
            
            contact_data = [
                {
                    'id': contact.id,
                    'username': contact.username,
                    'first_name': contact.first_name,
                    'last_name': contact.last_name,
                    'email': contact.email,
                    'full_name': f"{contact.first_name} {contact.last_name}".strip() or contact.username
                }
                for contact in users
            ]
            
            return Response(contact_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la récupération des contacts: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

print("Correctif des vues de messages chargé avec succès")

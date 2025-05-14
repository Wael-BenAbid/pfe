from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Mission, User, Notification, SystemActivity

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_penalty(request, mission_id):
    """
    Appliquer une pénalité à un utilisateur pour une mission en retard
    """
    # Vérifier que l'utilisateur est un admin ou un employé
    if request.user.user_type not in ['admin', 'employee']:
        return Response(
            {'error': 'Seuls les administrateurs et les employés peuvent appliquer des pénalités'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer la mission
    mission = get_object_or_404(Mission, id=mission_id)
    
    # Vérifier que la mission est en retard
    if mission.status != 'late':
        return Response(
            {'error': 'Seules les missions en retard peuvent recevoir une pénalité'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier que la mission n'est pas complétée
    if mission.completed:
        return Response(
            {'error': 'Les missions complétées ne peuvent pas recevoir de pénalité'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Récupérer l'utilisateur assigné à la mission
    user = mission.assigned_to
    
    # Vérifier que l'utilisateur est un employé
    if user.user_type != 'employee':
        return Response(
            {'error': 'Seuls les employés peuvent recevoir des pénalités'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Récupérer le nombre de jours de pénalité
    penalty_days = request.data.get('penalty_days', 1)
    
    try:
        penalty_days = int(penalty_days)
        if penalty_days <= 0:
            raise ValueError("Le nombre de jours doit être positif")
    except (ValueError, TypeError):
        return Response(
            {'error': 'Le nombre de jours de pénalité doit être un entier positif'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier que l'utilisateur a suffisamment de jours de congé
    if user.leave_balance < penalty_days:
        return Response(
            {'error': f"L'utilisateur n'a que {user.leave_balance} jour(s) de congé disponible(s)"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Appliquer la pénalité
    user.leave_balance -= penalty_days
    user.save()
    
    # Créer une notification pour l'utilisateur
    Notification.objects.create(
        user=user,
        title="Pénalité appliquée",
        message=f"Une pénalité de {penalty_days} jour(s) a été appliquée pour la mission en retard '{mission.title}'",
        type="warning"
    )
    
    # Enregistrer l'activité
    SystemActivity.objects.create(
        action_type="update",
        action=f"Pénalité de {penalty_days} jour(s) appliquée",
        user=request.user,
        details=f"Pénalité appliquée à {user.username} pour la mission '{mission.title}'",
        resource_type="User",
        resource_id=user.id
    )
    
    return Response({
        'success': True,
        'penalty_days': penalty_days,
        'new_leave_balance': user.leave_balance,
        'message': f"Pénalité de {penalty_days} jour(s) appliquée avec succès"
    })

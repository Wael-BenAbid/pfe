from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from .models import Mission, Notification

# Variable pour suivre la dernière vérification des missions en retard
last_check_time = None

@receiver(user_logged_in)
def check_late_missions_on_login(sender, user, request, **kwargs):
    """
    Vérifier les missions en retard lorsqu'un utilisateur se connecte
    """
    global last_check_time
    
    # Ne vérifier qu'une fois par heure maximum pour éviter de surcharger le système
    current_time = timezone.now()
    if last_check_time is None or (current_time - last_check_time).total_seconds() > 3600:
        # Date actuelle
        today = current_time.date()
        
        # Récupérer toutes les missions en attente dont la date d'échéance est passée
        late_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline__lt=today
        )
        
        # Mettre à jour le statut des missions en retard
        for mission in late_missions:
            mission.status = 'late'
            mission.save()
            
            # Créer une notification pour l'utilisateur assigné
            Notification.objects.create(
                user=mission.assigned_to,
                title="Mission en retard",
                message=f"La mission '{mission.title}' est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                type="error"
            )
            
            # Créer une notification pour le superviseur si c'est un employé
            if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                Notification.objects.create(
                    user=mission.supervisor,
                    title="Mission supervisée en retard",
                    message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                    type="error"
                )
        
        # Mettre à jour le temps de dernière vérification
        last_check_time = current_time

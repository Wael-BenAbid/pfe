"""
Système de limitation des emails pour éviter le spam
"""
import os
import json
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailLimiter:
    """
    Classe pour limiter l'envoi d'emails et éviter le spam
    """
    
    def __init__(self):
        # Limites par défaut
        self.daily_limit = getattr(settings, 'EMAIL_DAILY_LIMIT', 100)
        self.hourly_limit = getattr(settings, 'EMAIL_HOURLY_LIMIT', 20)
        self.per_user_daily_limit = getattr(settings, 'EMAIL_PER_USER_DAILY_LIMIT', 10)
        
        # Heures spécifiques pour les notifications d'échéances
        self.deadline_notification_hours = [8, 11, 17]  # 8h00, 11h30, 17h00
        
    def can_send_email(self, email_type='general', recipient_email=None):
        """
        Vérifier si on peut envoyer un email
        
        Args:
            email_type (str): Type d'email ('general', 'deadline', 'urgent')
            recipient_email (str): Email du destinataire
            
        Returns:
            bool: True si l'email peut être envoyé
        """
        now = datetime.now()
        
        # Vérifier les limites globales
        if not self._check_global_limits():
            logger.warning("Limite globale d'emails atteinte")
            return False
            
        # Vérifier les limites par utilisateur
        if recipient_email and not self._check_user_limits(recipient_email):
            logger.warning(f"Limite d'emails atteinte pour {recipient_email}")
            return False
            
        # Vérifier les heures spécifiques pour les notifications d'échéances
        if email_type == 'deadline':
            if not self._check_deadline_schedule(now):
                logger.info("Notification d'échéance en dehors des heures autorisées")
                return False
                
        return True
        
    def _check_global_limits(self):
        """Vérifier les limites globales d'envoi"""
        now = datetime.now()
        
        # Clés pour le cache
        daily_key = f"email_count_daily_{now.strftime('%Y-%m-%d')}"
        hourly_key = f"email_count_hourly_{now.strftime('%Y-%m-%d-%H')}"
        
        # Vérifier limite quotidienne
        daily_count = cache.get(daily_key, 0)
        if daily_count >= self.daily_limit:
            return False
            
        # Vérifier limite horaire
        hourly_count = cache.get(hourly_key, 0)
        if hourly_count >= self.hourly_limit:
            return False
            
        return True
        
    def _check_user_limits(self, recipient_email):
        """Vérifier les limites par utilisateur"""
        now = datetime.now()
        user_key = f"email_count_user_{recipient_email}_{now.strftime('%Y-%m-%d')}"
        
        user_count = cache.get(user_key, 0)
        return user_count < self.per_user_daily_limit
        
    def _check_deadline_schedule(self, now):
        """Vérifier si c'est une heure autorisée pour les notifications d'échéances"""
        current_hour = now.hour
        current_minute = now.minute
        
        # Autoriser l'envoi dans une fenêtre de 30 minutes autour des heures définies
        for hour in self.deadline_notification_hours:
            if hour == current_hour and current_minute <= 30:
                return True
            elif hour == current_hour - 1 and current_minute >= 30:
                return True
                
        return False
        
    def record_email_sent(self, email_type='general', recipient_email=None):
        """
        Enregistrer qu'un email a été envoyé
        
        Args:
            email_type (str): Type d'email
            recipient_email (str): Email du destinataire
        """
        now = datetime.now()
        
        # Clés pour le cache
        daily_key = f"email_count_daily_{now.strftime('%Y-%m-%d')}"
        hourly_key = f"email_count_hourly_{now.strftime('%Y-%m-%d-%H')}"
        
        # Incrémenter les compteurs globaux
        cache.set(daily_key, cache.get(daily_key, 0) + 1, 86400)  # 24h
        cache.set(hourly_key, cache.get(hourly_key, 0) + 1, 3600)  # 1h
        
        # Incrémenter le compteur par utilisateur
        if recipient_email:
            user_key = f"email_count_user_{recipient_email}_{now.strftime('%Y-%m-%d')}"
            cache.set(user_key, cache.get(user_key, 0) + 1, 86400)  # 24h
            
        logger.info(f"Email {email_type} envoyé à {recipient_email}")
        
    def get_email_stats(self):
        """Obtenir les statistiques d'envoi d'emails"""
        now = datetime.now()
        
        daily_key = f"email_count_daily_{now.strftime('%Y-%m-%d')}"
        hourly_key = f"email_count_hourly_{now.strftime('%Y-%m-%d-%H')}"
        
        return {
            'daily_count': cache.get(daily_key, 0),
            'daily_limit': self.daily_limit,
            'hourly_count': cache.get(hourly_key, 0),
            'hourly_limit': self.hourly_limit,
            'next_deadline_notification': self._get_next_deadline_time()
        }
        
    def _get_next_deadline_time(self):
        """Obtenir la prochaine heure de notification d'échéance"""
        now = datetime.now()
        
        for hour in self.deadline_notification_hours:
            next_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if next_time > now:
                return next_time
                
        # Si toutes les heures d'aujourd'hui sont passées, prendre la première heure de demain
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=self.deadline_notification_hours[0], minute=0, second=0, microsecond=0)


# Instance globale
email_limiter = EmailLimiter()

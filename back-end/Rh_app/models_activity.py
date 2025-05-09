from django.db import models
from .models import User

class SystemActivity(models.Model):
    """
    Modèle pour enregistrer les activités du système.
    """
    ACTION_CHOICES = (
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Resource Created'),
        ('update', 'Resource Updated'),
        ('delete', 'Resource Deleted'),
        ('approve', 'Application Approved'),
        ('reject', 'Application Rejected'),
        ('complete', 'Mission Completed'),
        ('assign', 'Mission Assigned'),
        ('system', 'System Action'),
    )
    
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    action = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True)
    resource_type = models.CharField(max_length=50, blank=True)  # Type de ressource (User, Mission, etc.)
    resource_id = models.IntegerField(null=True, blank=True)  # ID de la ressource concernée
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'System Activity'
        verbose_name_plural = 'System Activities'
    
    def __str__(self):
        if self.user:
            return f"{self.action} by {self.user.email} at {self.created_at}"
        return f"{self.action} at {self.created_at}"

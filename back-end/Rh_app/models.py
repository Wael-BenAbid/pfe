from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone


class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('employee', 'Employee'),
        ('intern', 'Intern'),
    )

    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='employee',
        validators=[RegexValidator(
            regex=r'^(admin|employee|intern)$',
            message='Type utilisateur invalide',
        )]
    )
    leave_balance = models.FloatField(default=0.0)
    approved = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    github_profile = models.URLField(max_length=255, null=True, blank=True, help_text="URL du profil GitHub")

    # Champs pour la réinitialisation de mot de passe
    password_reset_token = models.CharField(max_length=100, null=True, blank=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # S'assurer que password_reset_token_created a un fuseau horaire
        if self.password_reset_token_created and timezone.is_naive(self.password_reset_token_created):
            self.password_reset_token_created = timezone.make_aware(self.password_reset_token_created)
        super().save(*args, **kwargs)

    # Redéfinition des relations pour éviter les conflits avec AbstractUser
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_groups',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions',
        blank=True,
    )

    class Meta:
        db_table = 'Rh_app_user'


class Leave(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    LEAVE_TYPE_CHOICES = (
        ('annual', 'Congé annuel'),
        ('sick', 'Congé maladie'),
        ('personal', 'Congé personnel'),
        ('other', 'Autre'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
        default='annual',
        help_text="Type de congé"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True, help_text="Pièce jointe pour la demande de congé")
    attachment_name = models.CharField(max_length=255, null=True, blank=True, help_text="Nom original du fichier")
    attachment_type = models.CharField(max_length=50, null=True, blank=True, help_text="Type MIME du fichier attaché")

    def __str__(self):
        return f"{self.user.username} - {self.start_date} to {self.end_date}"


class Mission(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('completed', 'Terminée'),
        ('late', 'En retard'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_missions'
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,  # Si le superviseur est supprimé, la mission reste
        related_name='supervised_missions',
        null=True,  # Le superviseur est optionnel
        blank=True  # Le champ peut être vide dans les formulaires
    )
    deadline = models.DateField()
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Nouveaux champs
    attachment_link = models.URLField(max_length=500, null=True, blank=True, help_text="Lien vers un document Google Drive ou GitHub")
    attachment_file = models.FileField(upload_to='mission_attachments/', null=True, blank=True)
    completion_link = models.URLField(max_length=500, null=True, blank=True, help_text="Lien fourni par l'employé lors de la complétion")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    work_duration = models.DurationField(null=True, blank=True, help_text="Durée de travail sur la mission")

    def __str__(self):
        return self.title


class WorkHours(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.hours_worked}h"


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Champ pour stocker les heures travaillées calculées
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - {self.login_time.strftime('%Y-%m-%d %H:%M')}"

    def calculate_duration(self):
        """Calculate session duration in hours"""
        if not self.logout_time:
            return 0

        duration = self.logout_time - self.login_time

        # Vérifier si la durée est négative (cas où le logout_time est avant login_time)
        if duration.total_seconds() < 0:
            return 0

        # Vérifier si la durée est trop longue (plus de 24 heures)
        if duration.total_seconds() > 24 * 3600:
            # Limiter à 8 heures de travail maximum
            return 8.0

        # Convert to hours
        hours = duration.total_seconds() / 3600

        # Arrondir à 2 décimales
        return round(hours, 2)


class Internship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    title = models.CharField(max_length=200, default="Internship")
    description = models.TextField(blank=True, null=True)
    intern = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='internships'
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='supervised_interns'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ongoing'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.intern.username} - {self.start_date} to {self.end_date}"


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    )

    TYPE_CHOICES = (
        ('employee', 'Employé'),
        ('intern', 'Stagiaire'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='job_applications',
        null=True,
        blank=True
    )
    application_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    position = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=150, null=True, blank=True, help_text="Nom d'utilisateur souhaité")
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    education = models.TextField()
    experience = models.TextField()
    motivation = models.TextField()
    cv_file = models.FileField(upload_to='cvs/')
    github_profile = models.URLField(max_length=255, null=True, blank=True, help_text="URL du profil GitHub")
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    # Champ pour stocker le mot de passe défini lors de la candidature
    password = models.CharField(max_length=128, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.position}"


class Meeting(models.Model):
    LOCATION_CHOICES = (
        ('online', 'En ligne'),
        ('office', 'Bureau'),
        ('external', 'Lieu externe'),
    )

    STATUS_CHOICES = (
        ('scheduled', 'Planifié'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    location_type = models.CharField(
        max_length=20,
        choices=LOCATION_CHOICES,
        default='office'
    )
    location_details = models.CharField(max_length=200, blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)

    # Participants
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='organized_meetings'
    )
    participants = models.ManyToManyField(
        User,
        related_name='meetings'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    cancellation_reason = models.TextField(blank=True, null=True, help_text="Raison de l'annulation de la réunion")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.date_time.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=[
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error')
    ], default='info')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.created_at})"


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


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(blank=True, default="")  # Permettre un contenu vide
    is_important = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, null=True, blank=True, help_text="Nom original du fichier")
    attachment_type = models.CharField(max_length=50, null=True, blank=True, help_text="Type MIME du fichier attaché")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def formatted_date(self):
        """Retourne une date formatée pour l'affichage"""
        now = timezone.now()
        diff = now - self.created_at

        if diff.days == 0:
            if diff.seconds < 60:
                return "À l'instant"
            elif diff.seconds < 3600:
                minutes = diff.seconds // 60
                return f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
            else:
                hours = diff.seconds // 3600
                return f"Il y a {hours} heure{'s' if hours > 1 else ''}"
        elif diff.days == 1:
            return "Hier"
        elif diff.days < 7:
            return f"Il y a {diff.days} jour{'s' if diff.days > 1 else ''}"
        else:
            return self.created_at.strftime("%d/%m/%Y")


class EmailLog(models.Model):
    """
    Modèle pour suivre les emails envoyés aux utilisateurs
    afin de limiter le nombre d'emails par jour
    """
    EMAIL_TYPES = (
        ('late_mission', 'Mission en retard'),
        ('upcoming_deadline', 'Deadline approche'),
        ('meeting_cancelled', 'Réunion annulée'),
        ('meeting_scheduled', 'Réunion planifiée'),
        ('other', 'Autre'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_logs')
    email_type = models.CharField(max_length=50, choices=EMAIL_TYPES)
    reference_id = models.IntegerField(null=True, blank=True, help_text="ID de l'objet concerné (mission, réunion, etc.)")
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"Email {self.email_type} envoyé à {self.user.email} le {self.sent_at.strftime('%Y-%m-%d %H:%M')}"

    @classmethod
    def can_send_email(cls, user, email_type, reference_id=None):
        """
        Vérifie si un email peut être envoyé à l'utilisateur
        Cette fonction a été modifiée pour toujours retourner True (pas de limitation)
        """
        # Aucune limitation d'emails
        return True

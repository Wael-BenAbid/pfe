from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser, Group, Permission


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

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

    def __str__(self):
        return f"{self.user.username} - {self.login_time.strftime('%Y-%m-%d %H:%M')}"

    def calculate_duration(self):
        """Calculate session duration in hours"""
        if not self.logout_time:
            return 0

        duration = self.logout_time - self.login_time
        # Convert to hours
        hours = duration.total_seconds() / 3600
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

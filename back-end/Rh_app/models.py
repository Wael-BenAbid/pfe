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
    title = models.CharField(max_length=200)
    description = models.TextField()
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_missions'
    )
    supervisor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='supervised_missions'
    )
    deadline = models.DateField()
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

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
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
    )

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
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.intern.username} - {self.start_date} to {self.end_date}"


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
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.position}"

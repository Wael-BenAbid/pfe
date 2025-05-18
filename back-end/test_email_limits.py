"""
Script pour tester la limitation d'emails pour les différents types d'utilisateurs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
django.setup()

from Rh_app.models import User, EmailLog
from Rh_app.utils import send_email_notification

def test_email_limits():
    """
    Tester la limitation d'emails pour les différents types d'utilisateurs
    """
    # Récupérer un utilisateur de chaque type
    admin = User.objects.filter(user_type='admin').first()
    employee = User.objects.filter(user_type='employee').first()
    intern = User.objects.filter(user_type='intern').first()

    if not admin or not employee or not intern:
        print("Impossible de trouver un utilisateur de chaque type")
        return

    print(f"Admin: {admin.username} ({admin.email})")
    print(f"Employee: {employee.username} ({employee.email})")
    print(f"Intern: {intern.username} ({intern.email})")

    # Supprimer tous les logs d'emails existants
    EmailLog.objects.all().delete()
    print("Tous les logs d'emails ont été supprimés")

    # Tester l'envoi d'emails pour chaque type d'utilisateur
    test_user_email_limits(admin, "admin")
    test_user_email_limits(employee, "employee")
    test_user_email_limits(intern, "intern")

def test_user_email_limits(user, user_type):
    """
    Tester la limitation d'emails pour un utilisateur spécifique
    """
    print(f"\n=== Test pour {user_type}: {user.username} ===")

    # Tester l'envoi de 3 emails de type 'late_mission'
    print("\nTest pour 'late_mission':")
    for i in range(3):
        result = send_email_notification(
            subject=f"Test late mission {i+1}",
            message=f"Ceci est un test d'email pour une mission en retard {i+1}",
            recipient_list=[user.email],
            email_type='late_mission',
            reference_id=1
        )
        print(f"Email {i+1}: {'Envoyé' if result else 'Non envoyé (limité)'}")

    # Tester l'envoi de 3 emails de type 'upcoming_deadline'
    print("\nTest pour 'upcoming_deadline':")
    for i in range(3):
        result = send_email_notification(
            subject=f"Test upcoming deadline {i+1}",
            message=f"Ceci est un test d'email pour une deadline approchant {i+1}",
            recipient_list=[user.email],
            email_type='upcoming_deadline',
            reference_id=1
        )
        print(f"Email {i+1}: {'Envoyé' if result else 'Non envoyé (limité)'}")

    # Tester l'envoi de 3 emails de type 'meeting_cancelled'
    print("\nTest pour 'meeting_cancelled':")
    for i in range(3):
        result = send_email_notification(
            subject=f"Test meeting cancelled {i+1}",
            message=f"Ceci est un test d'email pour une réunion annulée {i+1}",
            recipient_list=[user.email],
            email_type='meeting_cancelled',
            reference_id=1
        )
        print(f"Email {i+1}: {'Envoyé' if result else 'Non envoyé (limité)'}")

    # Afficher le nombre d'emails envoyés à cet utilisateur
    email_logs = EmailLog.objects.filter(user=user)
    print(f"\nNombre total d'emails envoyés à {user_type}: {email_logs.count()}")

    # Afficher le détail par type d'email
    email_types = email_logs.values_list('email_type', flat=True).distinct()
    for email_type in email_types:
        count = email_logs.filter(email_type=email_type).count()
        print(f"- {email_type}: {count} emails")

if __name__ == "__main__":
    test_email_limits()

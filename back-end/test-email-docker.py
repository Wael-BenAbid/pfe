#!/usr/bin/env python3
"""
Script de test pour vérifier l'envoi d'emails Gmail SMTP dans Docker
"""

import os
import sys
import django
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMessage

def test_email_configuration():
    """Test de la configuration email"""
    print("🔍 === VÉRIFICATION CONFIGURATION EMAIL ===")
    print(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Non défini')}")
    print(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Non défini')}")
    print(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Non défini')}")
    print(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Non défini')}")
    print(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Non défini')}")
    print(f"EMAIL_HOST_PASSWORD: {'***' if getattr(settings, 'EMAIL_HOST_PASSWORD', None) else 'Non défini'}")
    print(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Non défini')}")
    print()

def test_simple_email():
    """Test d'envoi d'email simple"""
    print("📧 === TEST EMAIL SIMPLE ===")
    try:
        result = send_mail(
            subject='Test Email Docker - Gmail SMTP',
            message='Ceci est un test d\'email depuis Docker avec Gmail SMTP.\n\nSi vous recevez cet email, la configuration fonctionne parfaitement !',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['waelbenabid1@gmail.com'],
            fail_silently=False
        )
        print(f"✅ Email simple envoyé avec succès ! Résultat: {result}")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email simple: {e}")
        print(f"Type d'erreur: {type(e).__name__}")
        return False

def test_html_email():
    """Test d'envoi d'email HTML"""
    print("🎨 === TEST EMAIL HTML ===")
    try:
        html_content = """
        <html>
        <body>
            <h2>🎉 Test Email HTML - Docker Gmail SMTP</h2>
            <p>Ceci est un test d'email HTML depuis Docker.</p>
            <ul>
                <li>✅ Configuration Gmail SMTP</li>
                <li>✅ Docker Compose</li>
                <li>✅ Variables d'environnement</li>
            </ul>
            <p><strong>Si vous recevez cet email, tout fonctionne parfaitement !</strong></p>
        </body>
        </html>
        """
        
        email = EmailMessage(
            subject='Test Email HTML Docker - Gmail SMTP',
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['waelbenabid1@gmail.com']
        )
        email.content_subtype = 'html'
        result = email.send()
        
        print(f"✅ Email HTML envoyé avec succès ! Résultat: {result}")
        return True
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email HTML: {e}")
        print(f"Type d'erreur: {type(e).__name__}")
        return False

def test_connection():
    """Test de connexion SMTP"""
    print("🔌 === TEST CONNEXION SMTP ===")
    try:
        from django.core.mail import get_connection
        connection = get_connection()
        connection.open()
        print("✅ Connexion SMTP établie avec succès !")
        connection.close()
        print("✅ Connexion SMTP fermée proprement !")
        return True
    except Exception as e:
        print(f"❌ Erreur de connexion SMTP: {e}")
        print(f"Type d'erreur: {type(e).__name__}")
        return False

def main():
    """Fonction principale"""
    print("🚀 === DÉMARRAGE DES TESTS EMAIL DOCKER ===")
    print()
    
    # Configuration Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SystemeRH_v2.settings')
    django.setup()
    
    # Tests
    test_email_configuration()
    
    success_count = 0
    total_tests = 3
    
    if test_connection():
        success_count += 1
    
    if test_simple_email():
        success_count += 1
    
    if test_html_email():
        success_count += 1
    
    print()
    print("📊 === RÉSULTATS ===")
    print(f"Tests réussis: {success_count}/{total_tests}")
    
    if success_count == total_tests:
        print("🎉 Tous les tests ont réussi ! Gmail SMTP fonctionne parfaitement dans Docker !")
        return 0
    else:
        print("⚠️ Certains tests ont échoué. Vérifiez la configuration Gmail SMTP.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

"""
Module pour l'envoi d'emails via SendGrid ou le backend de console pour le développement.
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

def send_email(subject, message, recipient_list, from_email=None, html_content=None):
    """
    Envoie un email via SendGrid ou le backend de console.

    Args:
        subject (str): Sujet de l'email
        message (str): Corps de l'email en texte brut
        recipient_list (list): Liste des destinataires
        from_email (str, optional): Adresse email de l'expéditeur. Par défaut settings.DEFAULT_FROM_EMAIL.
        html_content (str, optional): Version HTML du message. Si None, le message texte sera utilisé.

    Returns:
        bool: True si l'email a été envoyé avec succès, False sinon
    """
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    # Si recipient_list est une liste, prendre le premier élément pour les logs
    to_email = recipient_list[0] if isinstance(recipient_list, list) else recipient_list

    # Extraire le nom et l'email de l'expéditeur
    if '<' in from_email:
        from_name = from_email.split('<')[0].strip()
        from_email_address = from_email.split('<')[1].split('>')[0]
    else:
        from_name = "RH System"
        from_email_address = from_email

    # Vérifier si la clé API SendGrid est configurée et si le backend est SMTP
    if settings.SENDGRID_API_KEY and settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        try:
            logger.info(f"Envoi d'email via SMTP (SendGrid) à {to_email}")

            # Utiliser le backend SMTP de Django pour envoyer l'email
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=from_email,
                to=recipient_list if isinstance(recipient_list, list) else [recipient_list]
            )

            if html_content:
                email.attach_alternative(html_content, "text/html")

            # Envoyer l'email
            result = email.send()

            if result:
                logger.info(f"Email envoyé avec succès via SMTP (SendGrid) à {to_email}")
                return True
            else:
                logger.error(f"Échec de l'envoi d'email via SMTP (SendGrid)")
                # Fallback au backend de console si l'envoi échoue
                return _send_via_console(subject, message, recipient_list, from_email, html_content, from_name, from_email_address, to_email)

        except Exception as e:
            logger.error(f"Exception lors de l'envoi d'email via SMTP (SendGrid): {str(e)}")
            print(f"Exception détaillée lors de l'envoi d'email via SMTP (SendGrid): {repr(e)}")
            # Fallback au backend de console si l'envoi échoue
            return _send_via_console(subject, message, recipient_list, from_email, html_content, from_name, from_email_address, to_email)
    else:
        # Utiliser le backend de console si SendGrid n'est pas configuré
        logger.info("Clé API SendGrid non configurée ou backend non SMTP, utilisation du backend de console")
        return _send_via_console(subject, message, recipient_list, from_email, html_content, from_name, from_email_address, to_email)

def _send_via_console(subject, message, recipient_list, from_email, html_content, from_name, from_email_address, to_email):
    """
    Fonction interne pour envoyer un email via le backend de console.
    """
    try:
        # Afficher des logs très visibles pour faciliter le débogage
        print("\n\n")
        print("*" * 80)
        print("*" + " " * 78 + "*")
        print("*" + " " * 25 + "ENVOI D'EMAIL VIA CONSOLE" + " " * 25 + "*")
        print("*" + " " * 78 + "*")
        print("*" * 80)
        print(f"* De: {from_name} <{from_email_address}>")
        print(f"* À: {to_email}")
        print(f"* Sujet: {subject}")
        print(f"* Message: ")
        print("*" + "-" * 78)
        for line in message.split('\n'):
            print(f"* {line}")
        print("*" + "-" * 78)

        if html_content:
            print(f"* HTML: Contenu HTML inclus")

        print("*" * 80)

        # Forcer l'utilisation du backend de console de Django
        from django.core.mail.backends.console import EmailBackend
        backend = EmailBackend(fail_silently=False)

        from django.core.mail import EmailMultiAlternatives
        email = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list if isinstance(recipient_list, list) else [recipient_list],
            connection=backend
        )

        if html_content:
            email.attach_alternative(html_content, "text/html")

        result = email.send()

        print(f"* Résultat de l'envoi: {result}")
        print("*" * 80)
        print("\n\n")

        return True

    except Exception as email_error:
        logger.error(f"Erreur d'envoi d'email via console: {str(email_error)}")
        print(f"Erreur d'envoi d'email: {str(email_error)}")
        print(f"===== FIN ERREUR D'ENVOI D'EMAIL =====")
        return False

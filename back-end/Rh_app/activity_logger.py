import logging
from .models import SystemActivity

logger = logging.getLogger(__name__)

def log_activity(action_type, action, user=None, ip_address=None, details="", resource_type="", resource_id=None, request=None):
    """
    Enregistre une activité système dans la base de données.

    Args:
        action_type (str): Type d'action (login, logout, create, update, delete, etc.)
        action (str): Description courte de l'action
        user (User, optional): L'utilisateur qui a effectué l'action
        ip_address (str, optional): Adresse IP de l'utilisateur
        details (str, optional): Détails supplémentaires sur l'action
        resource_type (str, optional): Type de ressource concernée (User, Mission, etc.)
        resource_id (int, optional): ID de la ressource concernée
        request (HttpRequest, optional): Objet request Django pour extraire des informations supplémentaires

    Returns:
        SystemActivity: L'objet d'activité créé
    """
    try:
        # Si request est fourni, on peut extraire l'adresse IP
        if request and not ip_address:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

        # Journaliser dans les logs du serveur pour le débogage
        log_message = f"DEBUG - Logging activity: {action_type} - {action}"
        if user:
            log_message += f" by {user.email}"
        if details:
            log_message += f" - {details}"

        logger.info(log_message)

        # Créer l'enregistrement d'activité
        activity = SystemActivity.objects.create(
            action_type=action_type,
            action=action,
            user=user,
            ip_address=ip_address,
            details=details,
            resource_type=resource_type,
            resource_id=resource_id
        )

        logger.info(f"Activity created with ID: {activity.id}")

        return activity
    except Exception as e:
        logger.error(f"Error logging activity: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

# Fonctions d'aide pour les types d'activités courants

def log_login(user, request=None, details=""):
    return log_activity(
        action_type="login",
        action="User Login",
        user=user,
        request=request,
        details=details
    )

def log_logout(user, request=None):
    return log_activity(
        action_type="logout",
        action="User Logout",
        user=user,
        request=request
    )

def log_create(user, resource_type, resource_id, action=None, request=None, details=""):
    if not action:
        action = f"Created {resource_type}"

    return log_activity(
        action_type="create",
        action=action,
        user=user,
        request=request,
        details=details,
        resource_type=resource_type,
        resource_id=resource_id
    )

def log_update(user, resource_type, resource_id, action=None, request=None, details=""):
    if not action:
        action = f"Updated {resource_type}"

    return log_activity(
        action_type="update",
        action=action,
        user=user,
        request=request,
        details=details,
        resource_type=resource_type,
        resource_id=resource_id
    )

def log_delete(user, resource_type, resource_id, action=None, request=None, details=""):
    if not action:
        action = f"Deleted {resource_type}"

    return log_activity(
        action_type="delete",
        action=action,
        user=user,
        request=request,
        details=details,
        resource_type=resource_type,
        resource_id=resource_id
    )

def log_approve(user, resource_type, resource_id, action=None, request=None, details=""):
    if not action:
        action = f"Approved {resource_type}"

    return log_activity(
        action_type="approve",
        action=action,
        user=user,
        request=request,
        details=details,
        resource_type=resource_type,
        resource_id=resource_id
    )

def log_system_action(action, details=""):
    return log_activity(
        action_type="system",
        action=action,
        details=details
    )

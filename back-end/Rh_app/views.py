from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from datetime import datetime
import logging
import json
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession, Meeting, Notification, SystemActivity, Message
from .serializers import (
    UserSerializer, LeaveSerializer, MissionSerializer,
    WorkHoursSerializer, InternshipSerializer, JobApplicationSerializer,
    UserSessionSerializer, MeetingSerializer, NotificationSerializer,
    SystemActivitySerializer, MessageSerializer
)
from .views_mission import MissionViewSet
from .activity_logger import log_login, log_logout

logger = logging.getLogger(__name__)

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Récupérer les identifiants
        username = request.data.get('username')
        password = request.data.get('password')

        # Si l'identifiant ressemble à un email, essayer de trouver l'utilisateur correspondant
        if username and '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                # Remplacer l'email par le nom d'utilisateur pour l'authentification
                request.data['username'] = user_obj.username
            except User.DoesNotExist:
                pass

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.user

        # Vérifier si l'utilisateur est approuvé
        if not user.approved:
            # Vérifier s'il a une candidature en attente ou rejetée
            application = JobApplication.objects.filter(
                email=user.email
            ).first()

            if application:
                if application.status == 'pending':
                    return Response(
                        {
                            "detail": "Votre candidature est en attente d'approbation.",
                            "status": "pending",
                            "application_id": application.id
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                elif application.status == 'rejected':
                    return Response(
                        {
                            "detail": "Votre candidature a été rejetée.",
                            "status": "rejected"
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Si aucune candidature n'est trouvée ou autre cas
            return Response(
                {"detail": "Votre compte n'est pas approuvé. Veuillez contacter un administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Créer une session utilisateur si l'utilisateur est approuvé
        UserSession.objects.create(
            user=user,
            login_time=timezone.now(),
            is_active=True
        )

        # Enregistrer l'activité de connexion
        ip_address = request.META.get('REMOTE_ADDR')
        log_login(user, request, f"Login via API from {ip_address}")

        response_data = {
            'refresh': str(serializer.validated_data['refresh']),
            'access': str(serializer.validated_data['access']),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type
            }
        }
        return Response(response_data)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password required'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Essayer d'abord d'authentifier avec l'email
        user = None
        try:
            # Chercher un utilisateur avec cet email
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            # Si aucun utilisateur n'est trouvé avec cet email, essayer avec le nom d'utilisateur
            user = authenticate(username=username, password=password)

        if not user:
            # Vérifier si c'est une candidature en attente
            try:
                application = JobApplication.objects.filter(
                    email=username,
                    status='pending'
                ).first()

                if application:
                    return Response(
                        {
                            "detail": "Votre candidature est en attente d'approbation.",
                            "status": "pending",
                            "application_id": application.id
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Vérifier si c'est une candidature rejetée
                application = JobApplication.objects.filter(
                    email=username,
                    status='rejected'
                ).first()

                if application:
                    return Response(
                        {
                            "detail": "Votre candidature a été rejetée.",
                            "status": "rejected"
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
            except:
                pass

            return Response({'error': 'Invalid credentials'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Vérifier si l'utilisateur est approuvé
        if not user.approved:
            # Vérifier s'il a une candidature en attente
            application = JobApplication.objects.filter(
                email=user.email,
                status='pending'
            ).first()

            if application:
                return Response(
                    {
                        "detail": "Votre candidature est en attente d'approbation.",
                        "status": "pending",
                        "application_id": application.id
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {"detail": "Votre compte n'est pas approuvé. Veuillez contacter un administrateur."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Create a new user session
        from .models import UserSession
        user_session = UserSession.objects.create(user=user)

        # Enregistrer l'activité de connexion directement
        ip_address = request.META.get('REMOTE_ADDR')
        try:
            SystemActivity.objects.create(
                action_type="login",
                action="User Login",
                user=user,
                ip_address=ip_address,
                details=f"Login via web from {ip_address}"
            )
            logger.info(f"Login activity recorded for user {user.email}")
        except Exception as e:
            logger.error(f"Error recording login activity: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type
            },
            'session_id': user_session.id
        })
    except Exception as e:
        return Response({'error': str(e)},
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    try:
        # Get the session ID from the request
        session_id = request.data.get('session_id')
        logger.info(f"Logout request received for user {request.user.username}, session_id: {session_id}")

        # Close the user session and record work hours
        from .models import UserSession, WorkHours
        from datetime import datetime, date, timedelta
        from django.utils import timezone

        # Initialiser hours_worked à 0
        hours_worked = 0

        # Get the user's active session
        user_session = None
        if session_id:
            # If session_id is provided, get that specific session
            try:
                session_id = int(session_id)  # Ensure session_id is an integer
                user_session = UserSession.objects.filter(id=session_id, is_active=True).first()
                if user_session:
                    logger.info(f"Found active session with ID {session_id} for user {request.user.username}")
                else:
                    logger.warning(f"No active session found with ID {session_id} for user {request.user.username}")
            except (ValueError, TypeError):
                logger.error(f"Invalid session_id format: {session_id}")

        if not user_session:
            # If no valid session found with the provided ID, get the most recent active session
            user_session = UserSession.objects.filter(user=request.user, is_active=True).order_by('-login_time').first()
            if user_session:
                logger.info(f"Using most recent active session (ID: {user_session.id}) for user {request.user.username}")
            else:
                logger.warning(f"No active sessions found for user {request.user.username}")

        if user_session:
            # Set the logout time and mark session as inactive
            user_session.logout_time = timezone.now()
            user_session.is_active = False
            user_session.save()

            # Calculate hours worked
            hours_worked = user_session.calculate_duration()

            # Vérifier si la durée est raisonnable (moins de 24 heures)
            if hours_worked > 24:
                logger.warning(f"Unreasonable session duration detected: {hours_worked} hours for session {user_session.id}")
                # Limiter à une durée raisonnable (8 heures)
                hours_worked = 8
                logger.info(f"Session duration capped at 8 hours for session {user_session.id}")

            # Ne pas enregistrer d'heures de travail pour les stagiaires
            if request.user.user_type != 'intern':
                # Create a work hours record for today
                today = date.today()

                # Check if there's already a record for today
                existing_record = WorkHours.objects.filter(user=request.user, date=today).first()

                if existing_record:
                    # Update existing record
                    existing_record.hours_worked += hours_worked
                    existing_record.save()
                    logger.info(f"Updated work hours record for {request.user.username} on {today}: added {hours_worked} hours, new total: {existing_record.hours_worked}")
                else:
                    # Create new record
                    new_record = WorkHours.objects.create(
                        user=request.user,
                        date=today,
                        hours_worked=hours_worked,
                        description=f"Automatic time tracking: {hours_worked} hours"
                    )
                    logger.info(f"Created new work hours record for {request.user.username} on {today}: {hours_worked} hours")
            else:
                logger.info(f"No work hours recorded for intern user {request.user.username}")

        # Blacklist the refresh token
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"Refresh token blacklisted for user {request.user.username}")
            except Exception as token_error:
                logger.warning(f"Error blacklisting token for user {request.user.username}: {str(token_error)}")
                # Continue with logout even if token blacklisting fails

        # Enregistrer l'activité de déconnexion
        log_logout(request.user, request)
        logger.info(f"Logout activity recorded for user {request.user.username}")

        return Response({
            'message': 'Successfully logged out',
            'hours_worked': hours_worked
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during logout for user {request.user.username if hasattr(request, 'user') else 'unknown'}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # Retourner une réponse plus générique pour éviter de divulguer des informations sensibles
        return Response({'error': 'An error occurred during logout'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_signup(request):
    from .serializers import UserSerializer
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        new_access_token = str(token.access_token)

        return Response({'access': new_access_token}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return Response({'error': 'Invalid refresh token or other error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Envoyer un email avec un lien pour réinitialiser le mot de passe
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Vérifier si l'utilisateur existe avec cet email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
            logger.info(f"Password reset requested for non-existent email: {email}")
            return Response({'message': 'Password reset email sent if email exists'}, status=status.HTTP_200_OK)

        # Vérifier si l'utilisateur est approuvé
        if not user.approved:
            # Vérifier s'il a une candidature en attente
            application = JobApplication.objects.filter(
                email=email,
                status='pending'
            ).first()

            if application:
                return Response({
                    'message': 'Your account is pending approval. You will be able to reset your password once your account is approved.',
                    'status': 'pending'
                }, status=status.HTTP_200_OK)

        # Générer un token unique pour la réinitialisation du mot de passe
        import uuid
        reset_token = str(uuid.uuid4())

        # Stocker le token dans la base de données
        user.password_reset_token = reset_token
        user.password_reset_token_created = datetime.now()
        user.save()

        # Envoyer un email avec le lien de réinitialisation
        from .utils import send_email_notification

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}&email={email}"

        subject = "Réinitialisation de votre mot de passe - RH System"
        message = (
            f"Bonjour {user.first_name} {user.last_name},\n\n"
            f"Vous avez demandé la réinitialisation de votre mot de passe sur RH System. "
            f"Veuillez cliquer sur le lien ci-dessous (ou le copier dans votre navigateur) pour définir un nouveau mot de passe :\n\n"
            f"LIEN DE RÉINITIALISATION :\n"
            f"{reset_url}\n\n"
            f"IMPORTANT :\n"
            f"- Ce lien est valable pendant 24 heures seulement\n"
            f"- Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email\n"
            f"- Pour toute question, contactez l'administrateur système\n\n"
            f"Cordialement,\n"
            f"L'équipe RH System"
        )

        send_email_notification(subject, message, [email])
        logger.info(f"Password reset email sent to: {email}")
        return Response({'message': 'Password reset email sent'}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")
        return Response({'error': 'Error sending password reset email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Réinitialiser le mot de passe avec un token
    """
    email = request.data.get('email')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not email or not token or not new_password:
        return Response({'error': 'Email, token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Vérifier la longueur du mot de passe
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Vérifier si l'utilisateur existe avec cet email et ce token
        try:
            user = User.objects.get(email=email, password_reset_token=token)
        except User.DoesNotExist:
            logger.warning(f"Password reset attempt with invalid email or token: {email}")
            return Response({'error': 'Invalid email or token'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si le token n'a pas expiré (24 heures)
        from django.utils import timezone
        if not user.password_reset_token_created or (timezone.now() - user.password_reset_token_created).days >= 1:
            logger.warning(f"Password reset attempt with expired token: {email}")
            return Response({'error': 'Password reset token has expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si l'utilisateur est approuvé
        if not user.approved:
            logger.warning(f"Password reset attempt for non-approved user: {email}")
            return Response({'error': 'Your account is not approved yet'}, status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour le mot de passe
        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_token_created = None
        user.save()

        logger.info(f"Password reset successful for user: {email}")

        # Envoyer un email de confirmation
        from .utils import send_email_notification

        subject = "Votre mot de passe a été réinitialisé"
        message = (
            f"Bonjour {user.first_name} {user.last_name},\n\n"
            f"Votre mot de passe a été réinitialisé avec succès.\n\n"
            f"Si vous n'avez pas effectué cette action, veuillez contacter immédiatement l'administrateur.\n\n"
            f"Cordialement,\n"
            f"L'équipe RH"
        )

        send_email_notification(subject, message, [email])

        return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return Response({'error': 'Error resetting password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'user_type': user.user_type,
        'is_approved': user.approved,
    })
# ViewSets
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        return Response({'detail': 'Use /api/signup/ endpoint for registration'},
                      status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            # Apply filter if provided in query params
            queryset = User.objects.all()
            user_type = self.request.query_params.get('user_type', None)
            if user_type and user_type != 'all':
                queryset = queryset.filter(user_type=user_type)
            return queryset
        return User.objects.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # Permettre aux utilisateurs de mettre à jour leur propre profil
        if request.user.is_superuser or request.user.user_type == 'admin' or request.user.id == user.id:
            return super().update(request, *args, **kwargs)
        return Response({'detail': 'Not authorized'}, status=403)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if request.user.is_superuser or request.user.user_type == 'admin':
            # Don't allow deleting yourself
            if user.id == request.user.id:
                return Response({'detail': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
            return super().destroy(request, *args, **kwargs)
        return Response({'detail': 'Not authorized'}, status=403)

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Leave.objects.all()
        return Leave.objects.filter(user=user)

    def destroy(self, request, *args, **kwargs):
        """
        Supprimer une demande de congé
        Seuls les administrateurs peuvent supprimer les demandes de congé
        """
        leave = self.get_object()

        # Vérifier que l'utilisateur est un administrateur
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Enregistrer l'activité de suppression
        from .models import SystemActivity
        SystemActivity.objects.create(
            action_type="delete",
            action="Leave Request Deleted",
            user=request.user,
            details=f"Demande de congé supprimée: {leave.start_date} - {leave.end_date} pour {leave.user.first_name} {leave.user.last_name}"
        )

        # Supprimer la demande de congé
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Récupérer les fichiers joints s'ils existent
        attachment = self.request.FILES.get('attachment', None)
        attachment_name = None
        attachment_type = None

        if attachment:
            attachment_name = attachment.name
            attachment_type = attachment.content_type

        # Créer la demande de congé
        leave = serializer.save(
            user=self.request.user,
            attachment=attachment,
            attachment_name=attachment_name,
            attachment_type=attachment_type
        )

        # Envoyer un email aux administrateurs pour les informer de la nouvelle demande de congé
        from .utils import send_email_notification, get_admin_emails
        admin_emails = get_admin_emails()

        if admin_emails:
            days = (leave.end_date - leave.start_date).days + 1
            subject = f"Nouvelle demande de congé de {leave.user.first_name} {leave.user.last_name}"
            message = (
                f"Une nouvelle demande de congé a été soumise :\n\n"
                f"Employé : {leave.user.first_name} {leave.user.last_name}\n"
                f"Date de début : {leave.start_date.strftime('%d/%m/%Y')}\n"
                f"Date de fin : {leave.end_date.strftime('%d/%m/%Y')}\n"
                f"Nombre de jours : {days}\n"
                f"Raison : {leave.reason}\n"
            )

            if attachment:
                message += f"\nUne pièce jointe a été fournie : {attachment_name}\n"

            message += f"\nConnectez-vous au système pour approuver ou rejeter cette demande."

            send_email_notification(subject, message, admin_emails)

    @action(detail=True, methods=['post'])
    def approve_leave(self, request, pk=None):
        """
        Approuver une demande de congé
        """
        leave = self.get_object()
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        leave.status = 'approved'
        leave.save()

        # Mise à jour du solde de congés
        days = (leave.end_date - leave.start_date).days + 1
        leave.user.leave_balance -= days
        leave.user.save()

        # Mettre à jour les notifications de demande de congé en attente
        from .models import Notification, Leave

        # Vérifier s'il reste des demandes en attente
        pending_leaves_count = Leave.objects.filter(status='pending').count()

        # Log pour débogage
        print(f"Nombre de demandes de congé en attente après approbation: {pending_leaves_count}")

        # Rechercher les notifications liées aux demandes de congé en attente
        pending_notifications = Notification.objects.filter(
            user=request.user,  # Notifications pour l'admin
            title__contains='Demandes de congé en attente'
        )

        if pending_leaves_count == 0:
            # S'il n'y a plus de demandes en attente, supprimer toutes les notifications
            if pending_notifications.exists():
                count = pending_notifications.count()
                pending_notifications.delete()
                print(f"Toutes les notifications de congé supprimées pour l'admin {request.user.username} ({count})")
        else:
            # S'il reste des demandes en attente, mettre à jour la notification existante
            if pending_notifications.exists():
                notification = pending_notifications.first()
                notification.message = f"Vous avez {pending_leaves_count} demande(s) de congé en attente d'approbation"
                notification.save()
                print(f"Notification de congé mise à jour pour l'admin {request.user.username}: {pending_leaves_count} en attente")
            else:
                # Créer une nouvelle notification si nécessaire
                Notification.objects.create(
                    user=request.user,
                    title='Demandes de congé en attente',
                    message=f"Vous avez {pending_leaves_count} demande(s) de congé en attente d'approbation",
                    type='info'
                )
                print(f"Nouvelle notification de congé créée pour l'admin {request.user.username}: {pending_leaves_count} en attente")

        # Envoyer un email à l'employé
        if leave.user and leave.user.email:
            from .utils import send_email_notification

            subject = "Votre demande de congé a été approuvée"
            message = (
                f"Bonjour {leave.user.first_name} {leave.user.last_name},\n\n"
                f"Votre demande de congé a été approuvée :\n\n"
                f"Date de début : {leave.start_date.strftime('%d/%m/%Y')}\n"
                f"Date de fin : {leave.end_date.strftime('%d/%m/%Y')}\n"
                f"Nombre de jours : {days}\n"
                f"Raison : {leave.reason}\n\n"
            )

            # Ajouter des informations sur la pièce jointe si elle existe
            if leave.attachment:
                message += f"Pièce jointe : {leave.attachment_name}\n\n"

            message += (
                f"Approuvé par : {request.user.first_name} {request.user.last_name}\n\n"
                f"Connectez-vous au système pour plus de détails."
            )

            send_email_notification(subject, message, [leave.user.email])

        return Response({'status': 'leave approved'})

    @action(detail=True, methods=['post'])
    def reject_leave(self, request, pk=None):
        """
        Rejeter une demande de congé
        """
        leave = self.get_object()
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        leave.status = 'rejected'
        leave.save()

        # Mettre à jour les notifications de demande de congé en attente
        from .models import Notification, Leave

        # Vérifier s'il reste des demandes en attente
        pending_leaves_count = Leave.objects.filter(status='pending').count()

        # Log pour débogage
        print(f"Nombre de demandes de congé en attente après rejet: {pending_leaves_count}")

        # Rechercher les notifications liées aux demandes de congé en attente
        pending_notifications = Notification.objects.filter(
            user=request.user,  # Notifications pour l'admin
            title__contains='Demandes de congé en attente'
        )

        if pending_leaves_count == 0:
            # S'il n'y a plus de demandes en attente, supprimer toutes les notifications
            if pending_notifications.exists():
                count = pending_notifications.count()
                pending_notifications.delete()
                print(f"Toutes les notifications de congé supprimées pour l'admin {request.user.username} ({count})")
        else:
            # S'il reste des demandes en attente, mettre à jour la notification existante
            if pending_notifications.exists():
                notification = pending_notifications.first()
                notification.message = f"Vous avez {pending_leaves_count} demande(s) de congé en attente d'approbation"
                notification.save()
                print(f"Notification de congé mise à jour pour l'admin {request.user.username}: {pending_leaves_count} en attente")
            else:
                # Créer une nouvelle notification si nécessaire
                Notification.objects.create(
                    user=request.user,
                    title='Demandes de congé en attente',
                    message=f"Vous avez {pending_leaves_count} demande(s) de congé en attente d'approbation",
                    type='info'
                )
                print(f"Nouvelle notification de congé créée pour l'admin {request.user.username}: {pending_leaves_count} en attente")

        # Envoyer un email à l'employé
        if leave.user and leave.user.email:
            from .utils import send_email_notification

            subject = "Votre demande de congé a été refusée"
            message = (
                f"Bonjour {leave.user.first_name} {leave.user.last_name},\n\n"
                f"Votre demande de congé a été refusée :\n\n"
                f"Date de début : {leave.start_date.strftime('%d/%m/%Y')}\n"
                f"Date de fin : {leave.end_date.strftime('%d/%m/%Y')}\n"
                f"Raison : {leave.reason}\n\n"
            )

            # Ajouter des informations sur la pièce jointe si elle existe
            if leave.attachment:
                message += f"Pièce jointe : {leave.attachment_name}\n\n"

            message += (
                f"Refusé par : {request.user.first_name} {request.user.last_name}\n\n"
                f"Connectez-vous au système pour plus de détails ou pour soumettre une nouvelle demande."
            )

            send_email_notification(subject, message, [leave.user.email])

        return Response({'status': 'leave rejected'})

class MissionViewSet(viewsets.ModelViewSet):
    queryset = Mission.objects.all()
    serializer_class = MissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]



    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Mission.objects.all()

        # Les employés peuvent voir les missions qu'ils supervisent et celles qui leur sont assignées
        if user.user_type == 'employee':
            return Mission.objects.filter(assigned_to=user) | Mission.objects.filter(supervisor=user)

        # Les stagiaires peuvent voir uniquement les missions qui leur sont assignées
        return Mission.objects.filter(assigned_to=user)

    def perform_create(self, serializer):
        if self.request.user.user_type == 'intern':
            raise PermissionDenied('Intern cannot create missions')

        # Récupérer les données du formulaire
        attachment_link = self.request.data.get('attachment_link', None)
        attachment_file = self.request.FILES.get('attachment_file', None)

        # Si le superviseur n'est pas spécifié, l'utilisateur qui crée la mission est automatiquement désigné comme superviseur
        supervisor = serializer.validated_data.get('supervisor', self.request.user)
        mission = serializer.save(
            supervisor=supervisor,
            attachment_link=attachment_link,
            attachment_file=attachment_file
        )

        # Vérifier si la mission a une date d'échéance passée
        from django.utils import timezone
        if mission.deadline < timezone.now().date():
            mission.status = 'late'
            mission.save()

        # Envoyer un email à l'assigné si la mission est assignée à quelqu'un
        if hasattr(mission, 'assigned_to') and mission.assigned_to:
            from .utils import send_email_notification

            subject = f"Nouvelle mission : {mission.title}"
            message = (
                f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                f"Une nouvelle mission vous a été assignée :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                f"Superviseur : {mission.supervisor.first_name} {mission.supervisor.last_name}\n\n"
            )

            if attachment_link:
                message += f"Lien de document : {attachment_link}\n\n"

            if attachment_file:
                message += f"Un fichier a été joint à cette mission. Connectez-vous au système pour le télécharger.\n\n"

            message += "Connectez-vous au système pour plus de détails.\n\n"
            message += "Cordialement,\n"
            message += "L'équipe RH"

            send_email_notification(subject, message, [mission.assigned_to.email])

    def update(self, request, *args, **kwargs):
        """
        Mettre à jour une mission
        """
        mission = self.get_object()
        # Vérifier que l'utilisateur est le superviseur, l'administrateur ou un superuser
        if (request.user != mission.supervisor and
            request.user.user_type != 'admin' and
            not request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Sauvegarder les anciennes valeurs pour la notification
        old_title = mission.title
        old_description = mission.description
        old_deadline = mission.deadline
        old_assigned_to = mission.assigned_to

        # Mettre à jour la mission
        response = super().update(request, *args, **kwargs)

        # Si la mise à jour a réussi et que c'est un admin qui a fait la modification
        if response.status_code == 200 and (request.user.user_type == 'admin' or request.user.is_superuser):
            # Récupérer la mission mise à jour
            updated_mission = self.get_object()

            # Si l'assigné a changé ou si c'est le même assigné, envoyer un email
            if updated_mission.assigned_to and updated_mission.assigned_to.email:
                from .utils import send_email_notification

                # Déterminer si c'est une réassignation ou une modification
                is_reassignment = old_assigned_to != updated_mission.assigned_to

                if is_reassignment:
                    subject = f"Nouvelle mission assignée : {updated_mission.title}"
                    message = (
                        f"Bonjour {updated_mission.assigned_to.first_name} {updated_mission.assigned_to.last_name},\n\n"
                        f"Une mission vous a été assignée par {request.user.first_name} {request.user.last_name} :\n\n"
                    )
                else:
                    subject = f"Mission modifiée : {updated_mission.title}"
                    message = (
                        f"Bonjour {updated_mission.assigned_to.first_name} {updated_mission.assigned_to.last_name},\n\n"
                        f"Une mission qui vous est assignée a été modifiée par {request.user.first_name} {request.user.last_name} :\n\n"
                    )

                # Ajouter les détails de la mission
                message += (
                    f"Titre : {updated_mission.title}\n"
                    f"Description : {updated_mission.description}\n"
                    f"Date d'échéance : {updated_mission.deadline.strftime('%d/%m/%Y')}\n\n"
                )

                # Ajouter les informations du superviseur si disponible
                if updated_mission.supervisor:
                    message += (
                        f"Superviseur : {updated_mission.supervisor.first_name} {updated_mission.supervisor.last_name}\n"
                        f"Email du superviseur : {updated_mission.supervisor.email}\n\n"
                    )

                message += "Connectez-vous au système pour voir les détails de cette mission."

                send_email_notification(subject, message, [updated_mission.assigned_to.email])

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Supprimer une mission
        """
        mission = self.get_object()
        # Vérifier que l'utilisateur est le superviseur, l'administrateur ou un superuser
        if (request.user != mission.supervisor and
            request.user.user_type != 'admin' and
            not request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Envoyer un email à l'assigné pour l'informer de la suppression
        if hasattr(mission, 'assigned_to') and mission.assigned_to and mission.assigned_to.email:
            from .utils import send_email_notification

            subject = f"Mission supprimée : {mission.title}"
            message = (
                f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                f"La mission suivante a été supprimée par {request.user.first_name} {request.user.last_name} :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                f"Si vous avez des questions, veuillez contacter votre superviseur.\n\n"
                f"Cordialement,\n"
                f"L'équipe RH"
            )

            send_email_notification(subject, message, [mission.assigned_to.email])

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def apply_penalty(self, request, pk=None):
        """
        Appliquer une pénalité pour une mission en retard
        """
        mission = self.get_object()

        # Vérifier que l'utilisateur est un administrateur
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Vérifier que la mission est en retard
        if mission.status != 'late':
            return Response({'error': 'Cannot apply penalty to a mission that is not late'}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier que l'assigné est un employé
        if mission.assigned_to.user_type != 'employee':
            return Response({'error': 'Cannot apply penalty to an intern'}, status=status.HTTP_400_BAD_REQUEST)

        # Récupérer le nombre de jours de pénalité
        penalty_days = request.data.get('penalty_days', 1)
        try:
            penalty_days = int(penalty_days)
            if penalty_days <= 0:
                raise ValueError("Penalty days must be positive")
        except (ValueError, TypeError):
            return Response({'error': 'Invalid penalty days'}, status=status.HTTP_400_BAD_REQUEST)

        # Appliquer la pénalité
        employee = mission.assigned_to
        if employee.leave_balance < penalty_days:
            penalty_days = employee.leave_balance  # Ne pas aller en négatif

        if penalty_days > 0:
            employee.leave_balance -= penalty_days
            employee.save()

            # Créer une notification pour l'employé
            from .models import Notification
            Notification.objects.create(
                user=employee,
                title="Pénalité appliquée",
                message=f"Une pénalité de {penalty_days} jour(s) de congé a été appliquée pour la mission en retard '{mission.title}'.",
                type="warning"
            )

            # Envoyer un email à l'employé
            from .utils import send_email_notification

            subject = f"Pénalité appliquée pour mission en retard : {mission.title}"
            message = (
                f"Bonjour {employee.first_name} {employee.last_name},\n\n"
                f"Une pénalité de {penalty_days} jour(s) de congé a été appliquée pour la mission en retard suivante :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                f"Votre solde de congés actuel est de {employee.leave_balance} jour(s).\n\n"
                f"Cordialement,\n"
                f"L'équipe RH"
            )

            send_email_notification(subject, message, [employee.email])

            return Response({
                'status': 'penalty applied',
                'penalty_days': penalty_days,
                'new_leave_balance': employee.leave_balance
            })
        else:
            return Response({'error': 'Employee has no leave balance to deduct'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def check_late_missions(self, request):
        """
        Vérifier les missions en retard et mettre à jour leur statut
        """
        # Permettre à tous les utilisateurs authentifiés d'appeler cette méthode
        # Les stagiaires doivent pouvoir vérifier les missions en retard

        # Récupérer toutes les missions en attente dont la date d'échéance est passée
        from django.utils import timezone
        today = timezone.now().date()

        late_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline__lt=today
        )

        # Mettre à jour le statut des missions en retard
        updated_count = 0
        for mission in late_missions:
            mission.status = 'late'
            mission.save()
            updated_count += 1

            # Créer une notification pour l'assigné
            from .models import Notification
            Notification.objects.create(
                user=mission.assigned_to,
                title="Mission en retard",
                message=f"La mission '{mission.title}' est maintenant en retard. La date d'échéance était le {mission.deadline.strftime('%d/%m/%Y')}.",
                type="error"
            )

            # Envoyer un email à l'assigné
            from .utils import send_email_notification

            subject = f"Mission en retard : {mission.title}"
            message = (
                f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                f"La mission suivante est maintenant en retard :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                f"Veuillez compléter cette mission dès que possible pour éviter une pénalité.\n\n"
                f"Cordialement,\n"
                f"L'équipe RH"
            )

            send_email_notification(subject, message, [mission.assigned_to.email])

        return Response({
            'status': 'late missions checked',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['post'])
    def check_upcoming_deadlines(self, request):
        """
        Vérifier les missions dont la date limite approche et envoyer des notifications
        """
        # Permettre à tous les utilisateurs authentifiés d'appeler cette méthode
        # Les stagiaires doivent pouvoir vérifier les missions dont la date limite approche

        # Date actuelle
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        # Récupérer toutes les missions en attente dont la date d'échéance est demain
        upcoming_missions = Mission.objects.filter(
            status='pending',
            completed=False,
            deadline=tomorrow
        )

        # Envoyer des notifications pour les missions dont la date limite approche
        notified_count = 0
        for mission in upcoming_missions:
            # Créer une notification pour l'utilisateur assigné
            from .models import Notification
            Notification.objects.create(
                user=mission.assigned_to,
                title="Date limite de mission approche",
                message=f"La mission '{mission.title}' doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                type="warning"
            )

            # Créer une notification pour le superviseur si c'est un employé
            if mission.supervisor and mission.supervisor.user_type in ['employee', 'admin']:
                Notification.objects.create(
                    user=mission.supervisor,
                    title="Date limite de mission supervisée approche",
                    message=f"La mission '{mission.title}' assignée à {mission.assigned_to.first_name} {mission.assigned_to.last_name} doit être terminée demain ({mission.deadline.strftime('%d/%m/%Y')}).",
                    type="warning"
                )

            # Envoyer un email à l'utilisateur assigné
            try:
                from .utils import send_email_notification
                subject = f"Rappel : Date limite de mission demain - {mission.title}"
                message = (
                    f"Bonjour {mission.assigned_to.first_name} {mission.assigned_to.last_name},\n\n"
                    f"La mission suivante doit être terminée demain :\n\n"
                    f"Titre : {mission.title}\n"
                    f"Description : {mission.description}\n"
                    f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                    f"Veuillez compléter cette mission avant la date limite pour éviter qu'elle ne soit marquée en retard.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(subject, message, [mission.assigned_to.email])
                notified_count += 1
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email à {mission.assigned_to.email}: {str(e)}")

        return Response({
            'status': 'upcoming deadlines checked',
            'notified_count': notified_count
        })

    @action(detail=True, methods=['post'])
    def complete_mission(self, request, pk=None):
        """
        Marquer une mission comme complétée
        """
        mission = self.get_object()
        if (request.user != mission.assigned_to and
            request.user != mission.supervisor and
            request.user.user_type != 'admin' and
            not request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer le lien de complétion s'il est fourni
        completion_link = request.data.get('completion_link', None)
        if completion_link:
            mission.completion_link = completion_link

        # Marquer la mission comme complétée
        mission.completed = True
        mission.status = 'completed'

        # Enregistrer la date de complétion
        from django.utils import timezone
        mission.completed_at = timezone.now()

        # Calculer la durée de travail
        if mission.created_at:
            mission.work_duration = mission.completed_at - mission.created_at

        mission.save()

        # Ajouter un jour de congé à l'employé qui a complété la mission
        if mission.assigned_to.user_type == 'employee':
            mission.assigned_to.leave_balance += 1
            mission.assigned_to.save()

            # Créer une notification pour l'employé
            from .models import Notification
            Notification.objects.create(
                user=mission.assigned_to,
                title="Jour de congé ajouté",
                message=f"Vous avez reçu un jour de congé supplémentaire pour avoir complété la mission '{mission.title}'.",
                type="success"
            )

        # Si c'est le stagiaire ou l'employé qui a marqué la mission comme complétée, envoyer des emails
        from .utils import send_email_notification, get_admin_emails

        # Email au superviseur si c'est l'assigné qui a complété la mission
        if request.user == mission.assigned_to and mission.supervisor and mission.supervisor.email:
            subject = f"Mission complétée : {mission.title}"
            message = (
                f"Bonjour {mission.supervisor.first_name} {mission.supervisor.last_name},\n\n"
                f"{mission.assigned_to.first_name} {mission.assigned_to.last_name} a marqué la mission suivante comme complétée :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n"
            )

            if mission.completion_link:
                message += f"Lien fourni : {mission.completion_link}\n\n"

            if mission.work_duration:
                days = mission.work_duration.days
                hours = mission.work_duration.seconds // 3600
                minutes = (mission.work_duration.seconds % 3600) // 60

                message += f"Durée de travail : "
                if days > 0:
                    message += f"{days} jours, "
                message += f"{hours} heures, {minutes} minutes\n\n"

            message += "Connectez-vous au système pour vérifier cette mission et la valider si nécessaire."

            send_email_notification(subject, message, [mission.supervisor.email])

        # Email aux administrateurs
        admin_emails = get_admin_emails()
        if admin_emails:
            admin_subject = f"Mission complétée : {mission.title}"
            admin_message = (
                f"Une mission a été marquée comme complétée :\n\n"
                f"Titre : {mission.title}\n"
                f"Description : {mission.description}\n"
                f"Date d'échéance : {mission.deadline.strftime('%d/%m/%Y')}\n\n"
                f"Assignée à : {mission.assigned_to.first_name} {mission.assigned_to.last_name}\n"
                f"Superviseur : {mission.supervisor.first_name if mission.supervisor else ''} {mission.supervisor.last_name if mission.supervisor else ''}\n"
                f"Marquée comme complétée par : {request.user.first_name} {request.user.last_name}\n\n"
            )

            if mission.completion_link:
                admin_message += f"Lien fourni : {mission.completion_link}\n\n"

            if mission.work_duration:
                days = mission.work_duration.days
                hours = mission.work_duration.seconds // 3600
                minutes = (mission.work_duration.seconds % 3600) // 60

                admin_message += f"Durée de travail : "
                if days > 0:
                    admin_message += f"{days} jours, "
                admin_message += f"{hours} heures, {minutes} minutes\n\n"

            if mission.assigned_to.user_type == 'employee':
                admin_message += f"Un jour de congé a été automatiquement ajouté à {mission.assigned_to.first_name} {mission.assigned_to.last_name}.\n\n"

            admin_message += "Connectez-vous au système pour plus de détails."

            send_email_notification(admin_subject, admin_message, admin_emails)

        return Response({
            'status': 'mission completed',
            'work_duration': str(mission.work_duration) if mission.work_duration else None,
            'leave_added': mission.assigned_to.user_type == 'employee'
        })

class WorkHoursViewSet(viewsets.ModelViewSet):
    queryset = WorkHours.objects.all()
    serializer_class = WorkHoursSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        Les stagiaires n'ont pas d'heures de travail
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            # Exclure les stagiaires des résultats
            return WorkHours.objects.exclude(user__user_type='intern')
        if user.user_type == 'intern':
            # Les stagiaires n'ont pas d'heures de travail
            return WorkHours.objects.none()
        return WorkHours.objects.filter(user=user)

    def perform_create(self, serializer):
        # Vérifier si l'utilisateur est un stagiaire
        if self.request.user.user_type == 'intern':
            return Response({'error': 'Les stagiaires ne peuvent pas enregistrer des heures de travail'},
                          status=status.HTTP_403_FORBIDDEN)

        # Vérifier si on essaie d'enregistrer des heures pour un stagiaire
        user_id = self.request.data.get('user')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                if user.user_type == 'intern':
                    return Response({'error': 'Les stagiaires ne peuvent pas avoir des heures de travail'},
                                  status=status.HTTP_403_FORBIDDEN)
            except User.DoesNotExist:
                pass

        if 'user' not in self.request.data:
            serializer.save(user=self.request.user)
        else:
            if self.request.user.user_type != 'admin' and not self.request.user.is_superuser:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            serializer.save()


class UserSessionViewSet(viewsets.ModelViewSet):
    queryset = UserSession.objects.all()
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return UserSession.objects.all()
        return UserSession.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Récupérer la session active de l'utilisateur
        """
        active_session = UserSession.objects.filter(user=request.user, is_active=True).order_by('-login_time').first()
        if active_session:
            serializer = self.get_serializer(active_session)
            return Response(serializer.data)
        return Response({'detail': 'No active session found'}, status=status.HTTP_404_NOT_FOUND)

class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Internship.objects.all()
        if user.user_type == 'intern':
            return Internship.objects.filter(intern=user)
        return Internship.objects.filter(supervisor=user)

    @action(detail=True, methods=['get'])
    def intern_details(self, request, pk=None):
        """
        Récupérer les détails d'un stagiaire pour un stage spécifique
        """
        internship = self.get_object()

        # Vérifier que l'utilisateur a le droit de voir ces détails
        if (request.user != internship.supervisor and
            request.user != internship.intern and
            request.user.user_type != 'admin' and
            not request.user.is_superuser):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer les détails du stagiaire
        intern = internship.intern

        # Retourner les détails du stagiaire
        return Response({
            'id': intern.id,
            'username': intern.username,
            'email': intern.email,
            'first_name': intern.first_name,
            'last_name': intern.last_name,
            'profile_image': intern.profile_image.url if intern.profile_image else None,
            'github_profile': intern.github_profile,
            'user_type': intern.user_type
        })

    def perform_create(self, serializer):
        """
        Envoyer des notifications par email lors de la création d'un stage
        """
        # Sauvegarder le stage
        internship = serializer.save()

        # Envoyer un email au stagiaire et au superviseur
        from .utils import send_email_notification

        # Email au stagiaire
        if internship.intern and internship.intern.email:
            intern_subject = f"Votre stage : {internship.title}"
            intern_message = (
                f"Bonjour {internship.intern.first_name} {internship.intern.last_name},\n\n"
                f"Vous avez été assigné(e) à un nouveau stage :\n\n"
                f"Titre : {internship.title}\n"
                f"Description : {internship.description or 'Aucune description fournie'}\n"
                f"Date de début : {internship.start_date.strftime('%d/%m/%Y')}\n"
                f"Date de fin : {internship.end_date.strftime('%d/%m/%Y')}\n"
                f"Statut : {internship.get_status_display()}\n\n"
                f"Superviseur : {internship.supervisor.first_name} {internship.supervisor.last_name}\n"
                f"Email du superviseur : {internship.supervisor.email}\n\n"
                f"Connectez-vous au système pour plus de détails.\n\n"
                f"Nous vous souhaitons un excellent stage !"
            )
            send_email_notification(intern_subject, intern_message, [internship.intern.email])

        # Email au superviseur
        if internship.supervisor and internship.supervisor.email:
            supervisor_subject = f"Nouveau stagiaire assigné : {internship.title}"
            supervisor_message = (
                f"Bonjour {internship.supervisor.first_name} {internship.supervisor.last_name},\n\n"
                f"Un nouveau stagiaire a été assigné sous votre supervision :\n\n"
                f"Titre du stage : {internship.title}\n"
                f"Description : {internship.description or 'Aucune description fournie'}\n"
                f"Date de début : {internship.start_date.strftime('%d/%m/%Y')}\n"
                f"Date de fin : {internship.end_date.strftime('%d/%m/%Y')}\n"
                f"Statut : {internship.get_status_display()}\n\n"
                f"Stagiaire : {internship.intern.first_name} {internship.intern.last_name}\n"
                f"Email du stagiaire : {internship.intern.email}\n\n"
                f"Connectez-vous au système pour gérer ce stage et assigner des missions au stagiaire."
            )
            send_email_notification(supervisor_subject, supervisor_message, [internship.supervisor.email])

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Changer le statut d'un stage
        """
        internship = self.get_object()
        if request.user != internship.supervisor and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value in ['pending', 'ongoing', 'completed', 'cancelled']:
            old_status = internship.status
            internship.status = status_value
            internship.save()

            # Envoyer des notifications par email pour le changement de statut
            from .utils import send_email_notification

            # Déterminer le message en fonction du nouveau statut
            status_message = {
                'pending': "en attente",
                'ongoing': "en cours",
                'completed': "terminé",
                'cancelled': "annulé"
            }.get(status_value, status_value)

            # Email au stagiaire
            if internship.intern and internship.intern.email:
                intern_subject = f"Mise à jour de votre stage : {internship.title}"
                intern_message = (
                    f"Bonjour {internship.intern.first_name} {internship.intern.last_name},\n\n"
                    f"Le statut de votre stage a été modifié de '{old_status}' à '{status_message}' :\n\n"
                    f"Titre : {internship.title}\n"
                    f"Description : {internship.description or 'Aucune description fournie'}\n"
                    f"Date de début : {internship.start_date.strftime('%d/%m/%Y')}\n"
                    f"Date de fin : {internship.end_date.strftime('%d/%m/%Y')}\n\n"
                    f"Superviseur : {internship.supervisor.first_name} {internship.supervisor.last_name}\n"
                    f"Email du superviseur : {internship.supervisor.email}\n\n"
                    f"Connectez-vous au système pour plus de détails."
                )
                send_email_notification(intern_subject, intern_message, [internship.intern.email])

            # Email au superviseur si l'admin a fait le changement
            if request.user.user_type == 'admin' and internship.supervisor and internship.supervisor.email:
                supervisor_subject = f"Mise à jour du stage : {internship.title}"
                supervisor_message = (
                    f"Bonjour {internship.supervisor.first_name} {internship.supervisor.last_name},\n\n"
                    f"Le statut du stage que vous supervisez a été modifié par un administrateur de '{old_status}' à '{status_message}' :\n\n"
                    f"Titre : {internship.title}\n"
                    f"Description : {internship.description or 'Aucune description fournie'}\n"
                    f"Date de début : {internship.start_date.strftime('%d/%m/%Y')}\n"
                    f"Date de fin : {internship.end_date.strftime('%d/%m/%Y')}\n\n"
                    f"Stagiaire : {internship.intern.first_name} {internship.intern.last_name}\n"
                    f"Email du stagiaire : {internship.intern.email}\n\n"
                    f"Connectez-vous au système pour plus de détails."
                )
                send_email_notification(supervisor_subject, supervisor_message, [internship.supervisor.email])

            return Response({'status': f'internship status changed to {status_value}'})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

def signup_view(request):
    """
    Vue pour l'inscription des utilisateurs
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')

        if User.objects.filter(username=username).exists():
            return render(request, 'signup.html', {'error': 'Username already exists'})

        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already exists'})

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type='employee'  # Par défaut, les nouveaux utilisateurs sont des employés
        )

        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')

    return render(request, 'signup.html')

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur et filtrer par statut si spécifié
        """
        user = self.request.user

        # Base queryset selon le type d'utilisateur
        if user.is_superuser or user.user_type == 'admin':
            queryset = JobApplication.objects.all()
        else:
            queryset = JobApplication.objects.filter(user=user)

        # Filtrer par statut si spécifié dans les paramètres de requête
        status_filter = self.request.query_params.get('status', None)
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        # Récupérer le mot de passe du serializer
        password = serializer.validated_data.pop('password')

        # Sauvegarder la candidature avec le mot de passe
        application = serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None,
            password=password  # Stocker le mot de passe dans le modèle JobApplication
        )

        # Envoyer un email de confirmation au candidat
        from .utils import send_email_notification

        # Email au candidat
        candidate_subject = "Votre candidature a été reçue"
        candidate_message = (
            f"Bonjour {application.first_name} {application.last_name},\n\n"
            f"Nous avons bien reçu votre candidature pour le poste de {application.position}.\n\n"
            f"Vous pouvez suivre l'état de votre candidature en utilisant les informations suivantes :\n"
            f"- ID de candidature : {application.id}\n"
            f"- Email : {application.email}\n\n"
            f"Votre candidature est actuellement en attente d'approbation par notre équipe RH. "
            f"Vous recevrez un email lorsque votre candidature sera approuvée ou rejetée.\n\n"
            f"Une fois approuvée, vous pourrez vous connecter avec votre email et le mot de passe que vous avez défini.\n\n"
            f"Cordialement,\n"
            f"L'équipe RH"
        )
        send_email_notification(candidate_subject, candidate_message, [application.email])

        # Email aux administrateurs
        from .utils import get_admin_emails
        admin_emails = get_admin_emails()

        if admin_emails:
            admin_subject = f"Nouvelle candidature : {application.position}"
            admin_message = (
                f"Une nouvelle candidature a été soumise :\n\n"
                f"Poste : {application.position}\n"
                f"Type : {application.application_type}\n"
                f"Candidat : {application.first_name} {application.last_name}\n"
                f"Email : {application.email}\n"
                f"Téléphone : {application.phone}\n\n"
                f"Connectez-vous au système pour examiner cette candidature."
            )
            send_email_notification(admin_subject, admin_message, admin_emails)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approuver une candidature
        """
        application = self.get_object()
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        application.status = 'approved'
        application.save()

        # Créer un compte utilisateur pour la candidature approuvée
        try:
            # Générer un nom d'utilisateur unique basé sur le prénom et le nom
            username_base = f"{application.first_name.lower()}.{application.last_name.lower()}"
            username = username_base
            counter = 1

            # Vérifier si le nom d'utilisateur existe déjà et en générer un nouveau si nécessaire
            while User.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter += 1

            # Utiliser le mot de passe défini par le candidat lors de la candidature
            # Si le mot de passe n'est pas défini, générer un mot de passe temporaire
            if application.password:
                password = application.password
            else:
                import random
                import string
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

            # Créer l'utilisateur
            # Les stagiaires n'ont pas de solde de congés
            leave_balance = 0.0 if application.application_type == 'intern' else 0.0

            user = User.objects.create_user(
                username=username,
                email=application.email,
                password=password,
                first_name=application.first_name,
                last_name=application.last_name,
                user_type=application.application_type,  # 'employee' ou 'intern'
                approved=True,  # L'utilisateur est déjà approuvé
                leave_balance=leave_balance  # Pas de solde de congés pour les stagiaires
            )

            # S'assurer que le champ approved est bien défini
            user.approved = True
            user.save()

            # Lier l'utilisateur à la candidature
            application.user = user
            application.save()

            # Envoyer un email au candidat avec ses informations de connexion
            from .utils import send_email_notification

            subject = "Votre candidature a été approuvée - Informations de connexion"
            message = (
                f"Félicitations ! Votre candidature pour le poste de {application.position} a été approuvée.\n\n"
                f"Votre compte a été créé avec les informations suivantes :\n"
                f"Nom d'utilisateur : {username}\n"
                f"Email : {application.email}\n\n"
                f"Vous pouvez maintenant vous connecter avec votre email et le mot de passe que vous avez défini lors de votre candidature.\n\n"
                f"Connectez-vous au système pour commencer à utiliser votre compte.\n\n"
                f"Cordialement,\n"
                f"L'équipe RH"
            )

            send_email_notification(subject, message, [application.email])

            return Response({
                'status': 'application approved',
                'user_created': True,
                'username': username
            })

        except Exception as e:
            logger.error(f"Error creating user account: {str(e)}")
            return Response({
                'status': 'application approved',
                'user_created': False,
                'error': str(e)
            })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Rejeter une candidature et supprimer toutes les données du candidat
        """
        application = self.get_object()
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Sauvegarder l'email et quelques informations pour l'email de notification
        email = application.email
        position = application.position
        first_name = application.first_name
        last_name = application.last_name

        # Envoyer un email au candidat avant de supprimer les données
        from .utils import send_email_notification

        subject = "Votre candidature a été rejetée"
        message = (
            f"Bonjour {first_name} {last_name},\n\n"
            f"Nous regrettons de vous informer que votre candidature pour le poste de {position} a été rejetée.\n\n"
            f"Nous vous remercions de l'intérêt que vous portez à notre entreprise et vous souhaitons bonne chance dans vos recherches futures.\n\n"
            f"Conformément à notre politique de confidentialité, toutes vos données personnelles ont été supprimées de notre système.\n\n"
            f"Cordialement,\n"
            f"L'équipe RH"
        )

        send_email_notification(subject, message, [email])

        # Supprimer complètement la candidature et toutes les données associées
        application.delete()

        return Response({'status': 'application rejected and data deleted'})




class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limiter les résultats aux notifications de l'utilisateur connecté
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Notification.objects.all()
        return Notification.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Associer la notification à l'utilisateur spécifié ou à l'utilisateur connecté
        """
        user_id = self.request.data.get('user')
        if user_id and (self.request.user.is_superuser or self.request.user.user_type == 'admin'):
            # Si un ID utilisateur est fourni et que l'utilisateur connecté est admin
            try:
                user = User.objects.get(id=user_id)
                serializer.save(user=user)
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User does not exist'})
        else:
            # Sinon, associer la notification à l'utilisateur connecté
            serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Supprimer toutes les notifications de l'utilisateur
        """
        notifications = Notification.objects.filter(user=request.user)
        notifications.delete()
        return Response({'status': 'all notifications deleted'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marquer une notification comme lue et la supprimer automatiquement
        """
        notification = self.get_object()
        if notification.user != request.user and not request.user.is_superuser and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Supprimer la notification au lieu de la marquer comme lue
        notification.delete()
        return Response({'status': 'notification marked as read and deleted'})


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Meeting.objects.all()

        # Pour les employés, retourner les réunions qu'ils organisent ou auxquelles ils participent
        if user.user_type == 'employee':
            return Meeting.objects.filter(organizer=user) | Meeting.objects.filter(participants=user)

        # Pour les stagiaires, retourner uniquement les réunions auxquelles ils participent
        return Meeting.objects.filter(participants=user)

    def perform_create(self, serializer):
        """
        Seuls les administrateurs et les employés peuvent créer des réunions
        """
        user = self.request.user
        if user.user_type == 'intern':
            raise PermissionDenied('Interns cannot create meetings')

        meeting = serializer.save(organizer=user)

        # Envoyer un email à tous les participants
        if meeting.participants.exists():
            from .utils import send_email_notification

            for participant in meeting.participants.all():
                subject = f"Nouveau rendez-vous : {meeting.title}"
                message = (
                    f"Bonjour {participant.first_name} {participant.last_name},\n\n"
                    f"Vous avez été invité(e) à un nouveau rendez-vous :\n\n"
                    f"Titre : {meeting.title}\n"
                    f"Description : {meeting.description}\n"
                    f"Date et heure : {meeting.date_time.strftime('%d/%m/%Y à %H:%M')}\n"
                    f"Lieu : {meeting.location if meeting.location else 'En ligne'}\n"
                    f"Type : {meeting.meeting_type}\n\n"
                    f"Organisateur : {meeting.organizer.first_name} {meeting.organizer.last_name}\n\n"
                    f"Connectez-vous au système pour plus de détails.\n\n"
                    f"Cordialement,\n"
                    f"L'équipe RH"
                )

                send_email_notification(subject, message, [participant.email])

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """
        Ajouter un participant à une réunion
        """
        meeting = self.get_object()

        # Vérifier que l'utilisateur est l'organisateur ou un administrateur
        if request.user != meeting.organizer and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer l'ID du participant à ajouter
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({'error': 'Participant ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participant = User.objects.get(id=participant_id)
            meeting.participants.add(participant)

            # Envoyer un email au participant
            from .utils import send_email_notification

            # Déterminer le type de lieu
            location_info = ""
            if meeting.location_type == 'online':
                location_info = f"Type: En ligne\nLien de réunion: {meeting.meeting_link}"
            elif meeting.location_type == 'office':
                location_info = f"Type: Au bureau\nLieu: {meeting.location_details}"
            elif meeting.location_type == 'external':
                location_info = f"Type: Lieu externe\nLieu: {meeting.location_details}"

            # Envoyer l'email au participant
            if participant.email:
                subject = f"Invitation à un rendez-vous : {meeting.title}"
                message = (
                    f"Bonjour {participant.first_name} {participant.last_name},\n\n"
                    f"Vous avez été invité(e) à un rendez-vous par {meeting.organizer.first_name} {meeting.organizer.last_name} :\n\n"
                    f"Titre : {meeting.title}\n"
                    f"Description : {meeting.description or 'Aucune description fournie'}\n"
                    f"Date et heure : {meeting.date_time.strftime('%d/%m/%Y à %H:%M')}\n"
                    f"Durée : {meeting.duration_minutes} minutes\n"
                    f"{location_info}\n\n"
                    f"Organisateur : {meeting.organizer.first_name} {meeting.organizer.last_name}\n"
                    f"Email de l'organisateur : {meeting.organizer.email}\n\n"
                    f"Connectez-vous au système pour plus de détails."
                )
                send_email_notification(subject, message, [participant.email])

            return Response({'status': 'participant added'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """
        Retirer un participant d'une réunion
        """
        meeting = self.get_object()

        # Vérifier que l'utilisateur est l'organisateur ou un administrateur
        if request.user != meeting.organizer and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer l'ID du participant à retirer
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({'error': 'Participant ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participant = User.objects.get(id=participant_id)
            meeting.participants.remove(participant)
            return Response({'status': 'participant removed'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Changer le statut d'une réunion
        """
        meeting = self.get_object()

        # Vérifier que l'utilisateur est l'organisateur ou un administrateur
        if request.user != meeting.organizer and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Récupérer le nouveau statut
        status_value = request.data.get('status')
        if not status_value:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

        if status_value not in ['scheduled', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        meeting.status = status_value
        meeting.save()
        return Response({'status': f'meeting status changed to {status_value}'})


class SystemActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour afficher les activités du système.
    Lecture seule - les activités sont créées par le système, pas par les utilisateurs.
    """
    queryset = SystemActivity.objects.all().order_by('-created_at')
    serializer_class = SystemActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Seuls les administrateurs peuvent voir les activités du système.
        """
        if self.request.user.is_authenticated and (self.request.user.is_superuser or self.request.user.user_type == 'admin'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        """
        Filtrer les activités par type, utilisateur, date, etc.
        """
        queryset = SystemActivity.objects.all().order_by('-created_at')

        # Filtrer par type d'action
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)

        # Filtrer par utilisateur
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filtrer par date (début)
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass

        # Filtrer par date (fin)
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass

        return queryset


# La classe MessageViewSet a été déplacée vers views_message.py
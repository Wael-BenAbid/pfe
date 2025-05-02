from django.shortcuts import render
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
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession, Meeting, Notification
from .serializers import (
    UserSerializer, LeaveSerializer, MissionSerializer,
    WorkHoursSerializer, InternshipSerializer, JobApplicationSerializer,
    UserSessionSerializer, MeetingSerializer, NotificationSerializer
)

logger = logging.getLogger(__name__)

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.user
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

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Create a new user session
        from .models import UserSession
        user_session = UserSession.objects.create(user=user)

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

        # Close the user session and record work hours
        from .models import UserSession, WorkHours
        from datetime import datetime, date
        import pytz

        # Get the user's active session
        if session_id:
            # If session_id is provided, get that specific session
            user_session = UserSession.objects.filter(id=session_id, is_active=True).first()
        else:
            # Otherwise, get the most recent active session for the user
            user_session = UserSession.objects.filter(user=request.user, is_active=True).order_by('-login_time').first()

        if user_session:
            # Set the logout time and mark session as inactive
            user_session.logout_time = datetime.now(pytz.UTC)
            user_session.is_active = False
            user_session.save()

            # Calculate hours worked
            hours_worked = user_session.calculate_duration()

            # Create a work hours record for today
            today = date.today()

            # Check if there's already a record for today
            existing_record = WorkHours.objects.filter(user=request.user, date=today).first()

            if existing_record:
                # Update existing record
                existing_record.hours_worked += hours_worked
                existing_record.save()
            else:
                # Create new record
                WorkHours.objects.create(
                    user=request.user,
                    date=today,
                    hours_worked=hours_worked,
                    description=f"Automatic time tracking: {hours_worked} hours"
                )

        # Blacklist the refresh token
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        return Response({
            'message': 'Successfully logged out',
            'hours_worked': hours_worked if user_session else 0
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'user_type': user.user_type,
        'is_approved': user.is_approved,
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
        if request.user.is_superuser or request.user.user_type == 'admin':
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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

        # Si l'utilisateur est un employé ou un admin, il est le superviseur par défaut
        serializer.save(supervisor=self.request.user)

    @action(detail=True, methods=['post'])
    def complete_mission(self, request, pk=None):
        """
        Marquer une mission comme complétée
        """
        mission = self.get_object()
        if request.user != mission.assigned_to and request.user != mission.supervisor:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        mission.completed = True
        mission.save()
        return Response({'status': 'mission completed'})

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
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return WorkHours.objects.all()
        return WorkHours.objects.filter(user=user)

    def perform_create(self, serializer):
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

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Changer le statut d'un stage
        """
        internship = self.get_object()
        if request.user != internship.supervisor and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value in ['pending', 'active', 'completed', 'terminated']:
            internship.status = status_value
            internship.save()
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
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Limiter les résultats en fonction du type d'utilisateur
        """
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return JobApplication.objects.all()
        return JobApplication.objects.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

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

            # Générer un mot de passe temporaire
            import random
            import string
            temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

            # Créer l'utilisateur
            user = User.objects.create_user(
                username=username,
                email=application.email,
                password=temp_password,
                first_name=application.first_name,
                last_name=application.last_name,
                user_type=application.application_type,  # 'employee' ou 'intern'
                approved=True  # L'utilisateur est déjà approuvé
            )

            # Lier l'utilisateur à la candidature
            application.user = user
            application.save()

            # Envoyer un email au candidat avec ses informations de connexion
            try:
                send_mail(
                    'Your application has been approved - Account Information',
                    f'Congratulations! Your application for {application.position} has been approved.\n\n'
                    f'Your account has been created with the following credentials:\n'
                    f'Username: {username}\n'
                    f'Temporary Password: {temp_password}\n\n'
                    f'Please log in and change your password as soon as possible.',
                    settings.DEFAULT_FROM_EMAIL,
                    [application.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Email sending failed: {str(e)}")

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
        Rejeter une candidature
        """
        application = self.get_object()
        if request.user.user_type != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        application.status = 'rejected'
        application.save()

        # Envoyer un email au candidat (simulation)
        try:
            send_mail(
                'Your application status',
                f'Thank you for your interest in {application.position}. Unfortunately, we have decided to move forward with other candidates.',
                settings.DEFAULT_FROM_EMAIL,
                [application.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")

        return Response({'status': 'application rejected'})


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
        Marquer toutes les notifications de l'utilisateur comme lues
        """
        notifications = Notification.objects.filter(user=request.user, read=False)
        notifications.update(read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marquer une notification comme lue
        """
        notification = self.get_object()
        if notification.user != request.user and not request.user.is_superuser and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        notification.read = True
        notification.save()
        return Response({'status': 'notification marked as read'})


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

        serializer.save(organizer=user)

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

from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
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

from .models import User, Leave, Mission, WorkHours, Internship, JobApplication
from .serializers import (
    UserSerializer, LeaveSerializer, MissionSerializer, 
    WorkHoursSerializer, InternshipSerializer, JobApplicationSerializer
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
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return Response({'error': 'Invalid refresh token or other error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if request.user.is_superuser or request.user.user_type == 'admin':
            return super().update(request, *args, **kwargs)
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
        return Mission.objects.filter(assigned_to=user) | Mission.objects.filter(supervisor=user)
    
    def perform_create(self, serializer):
        if self.request.user.user_type == 'intern':
            return Response({'error': 'Intern cannot create missions'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
    
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
        
        # Envoyer un email au candidat (simulation)
        try:
            send_mail(
                'Your application has been approved',
                f'Congratulations! Your application for {application.position} has been approved.',
                settings.DEFAULT_FROM_EMAIL,
                [application.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
        
        return Response({'status': 'application approved'})
    
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
class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.user_type == 'admin':
            return Internship.objects.all()
        return Internship.objects.filter(intern=user) | Internship.objects.filter(supervisor=user)

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.AllowAny]  # à adapter selon le besoin

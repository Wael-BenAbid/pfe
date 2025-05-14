from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    CustomTokenObtainPairView,
    UserViewSet,
    LeaveViewSet,
    WorkHoursViewSet,
    InternshipViewSet,
    JobApplicationViewSet,
    UserSessionViewSet,
    MeetingViewSet,
    NotificationViewSet,
    SystemActivityViewSet,
    api_logout,
    api_signup,
    login_view,
    get_user_info,
    refresh_token,
    forgot_password,
    reset_password,
)
from .views_mission import MissionViewSet
# Les méthodes sont directement définies dans views_mission.py

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'missions', MissionViewSet)
router.register(r'work-hours', WorkHoursViewSet)
router.register(r'internships', InternshipViewSet)
router.register(r'job-applications', JobApplicationViewSet)
router.register(r'user-sessions', UserSessionViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'system-activities', SystemActivityViewSet)

# Endpoints pour les missions
mission_list = MissionViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
mission_detail = MissionViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
mission_supervised = MissionViewSet.as_view({'get': 'supervised'})
mission_assigned = MissionViewSet.as_view({'get': 'assigned'})
mission_stats = MissionViewSet.as_view({'get': 'stats'})
mission_check_late = MissionViewSet.as_view({'post': 'check_late_missions'})
mission_check_upcoming = MissionViewSet.as_view({'post': 'check_upcoming_deadlines'})
mission_complete = MissionViewSet.as_view({'post': 'complete_mission'})
mission_apply_penalty = MissionViewSet.as_view({'post': 'apply_penalty'})

urlpatterns = [
    path('', include(router.urls)),
    # Custom user management endpoints
    path('users/request-access/', UserViewSet.as_view({'post': 'request_access'}), name='user-request-access'),
    path('users/<int:pk>/approve/', UserViewSet.as_view({'post': 'approve_user'}), name='user-approve'),
    path('users/<int:pk>/reject/', UserViewSet.as_view({'post': 'reject_user'}), name='user-reject'),
    # User endpoints
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('api/get-user-info/', get_user_info, name='get_user_info'),
    # Authentication endpoints
    path('auth/signup/', api_signup, name='api_signup'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', api_logout, name='api_logout'),
    path('auth/token/obtain/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/verify-token/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/refresh-token/', refresh_token, name='token_refresh'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/reset-password/', reset_password, name='reset_password'),

    # Endpoints d'authentification API
    path('api/auth/signup/', api_signup, name='api_signup_v2'),
    path('api/auth/login/', login_view, name='login_v2'),
    path('api/auth/logout/', api_logout, name='api_logout_v2'),
    path('api/auth/token/obtain/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair_v2'),
    path('api/auth/verify-token/', TokenVerifyView.as_view(), name='token_verify_v2'),
    path('api/auth/refresh-token/', refresh_token, name='token_refresh_v2'),
    path('api/auth/forgot-password/', forgot_password, name='forgot_password_v2'),
    path('api/auth/reset-password/', reset_password, name='reset_password_v2'),

    # Endpoint pour appliquer une pénalité
    path('missions/<int:pk>/apply_penalty/', mission_apply_penalty, name='apply_penalty'),

    # Endpoints pour les missions
    path('missions/supervised/', mission_supervised, name='missions-supervised'),
    path('missions/assigned/', mission_assigned, name='missions-assigned'),
    path('missions/stats/', mission_stats, name='missions-stats'),
    path('missions/check_late_missions/', mission_check_late, name='missions-check-late'),
    path('missions/check_upcoming_deadlines/', mission_check_upcoming, name='missions-check-upcoming'),
    path('missions/<int:pk>/complete_mission/', mission_complete, name='mission-complete'),

    # Endpoints API pour les missions
    path('api/missions/supervised/', mission_supervised, name='api-missions-supervised'),
    path('api/missions/assigned/', mission_assigned, name='api-missions-assigned'),
    path('api/missions/stats/', mission_stats, name='api-missions-stats'),
    path('api/missions/check_late_missions/', mission_check_late, name='api-missions-check-late'),
    path('api/missions/check_upcoming_deadlines/', mission_check_upcoming, name='api-missions-check-upcoming'),
    path('api/missions/<int:pk>/complete_mission/', mission_complete, name='api-mission-complete'),
    path('api/missions/<int:pk>/apply_penalty/', mission_apply_penalty, name='api-mission-apply-penalty'),
]

# Le patch n'est plus nécessaire car les méthodes sont directement définies dans views_mission.py

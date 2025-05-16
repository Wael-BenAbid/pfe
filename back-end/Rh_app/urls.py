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
    SystemActivityViewSet,
    api_logout,
    api_signup,
    login_view,
    get_user_info,
    refresh_token,
    forgot_password,
    reset_password,
)
from .views_message import MessageViewSet
from .views_notification import NotificationViewSet as NotificationViewSetCustom
from .views_mission import MissionViewSet, mission_supervised, mission_assigned, mission_stats, mission_check_late, mission_check_upcoming, mission_complete, mission_apply_penalty
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
router.register(r'notifications', NotificationViewSetCustom)
router.register(r'system-activities', SystemActivityViewSet)
router.register(r'messages', MessageViewSet)

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
    # Endpoints pour les missions (placés avant le router pour éviter les conflits)
    path('missions/supervised/', mission_supervised, name='missions-supervised'),
    path('missions/assigned/', mission_assigned, name='missions-assigned'),
    path('missions/stats/', mission_stats, name='missions-stats'),
    path('missions/check_late_missions/', mission_check_late, name='missions-check-late'),
    path('missions/check_upcoming_deadlines/', mission_check_upcoming, name='missions-check-upcoming'),
    path('missions/<int:pk>/complete_mission/', mission_complete, name='mission-complete'),
    path('missions/<int:pk>/apply_penalty/', mission_apply_penalty, name='mission-apply-penalty'),

    # Inclure les routes du routeur après les routes spécifiques
    path('', include(router.urls)),

    # Custom user management endpoints
    path('users/request-access/', UserViewSet.as_view({'post': 'request_access'}), name='user-request-access'),
    path('users/<int:pk>/approve/', UserViewSet.as_view({'post': 'approve_user'}), name='user-approve'),
    path('users/<int:pk>/reject/', UserViewSet.as_view({'post': 'reject_user'}), name='user-reject'),
    # User endpoints
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('get-user-info/', get_user_info, name='get_user_info'),
    # Authentication endpoints
    path('auth/signup/', api_signup, name='api_signup'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', api_logout, name='api_logout'),
    path('auth/token/obtain/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/verify-token/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/refresh-token/', refresh_token, name='token_refresh'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/reset-password/', reset_password, name='reset_password'),

    # Tous les endpoints d'authentification sont maintenant accessibles sans préfixe /api/

    # Endpoints pour nettoyer les notifications de congé
    path('notifications/clean-leave-notifications/', NotificationViewSetCustom.as_view({'delete': 'clean_leave_notifications'}), name='clean-leave-notifications'),

]

# Le patch n'est plus nécessaire car les méthodes sont directement définies dans views_mission.py

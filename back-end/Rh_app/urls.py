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
from .views_penalty import apply_penalty
# Importer le patch pour MissionViewSet
from .views_mission_patch import patch_mission_viewset

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
    path('api/missions/<int:mission_id>/apply_penalty/', apply_penalty, name='apply_penalty'),
]

# Appliquer le patch pour MissionViewSet
try:
    patch_mission_viewset()
except NameError:
    print("Fonction patch_mission_viewset non disponible")

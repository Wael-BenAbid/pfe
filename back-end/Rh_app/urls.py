from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    CustomTokenObtainPairView,
    UserViewSet,
    LeaveViewSet,
    MissionViewSet,
    WorkHoursViewSet,
    InternshipViewSet,
    JobApplicationViewSet,
    UserSessionViewSet,
    MeetingViewSet,
    NotificationViewSet,
    api_logout,
    api_signup,
    login_view,
    get_user_info,
    refresh_token,
    forgot_password,
    reset_password,
)

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
]

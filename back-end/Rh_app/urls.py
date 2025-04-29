from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import (
    CustomTokenObtainPairView,
    UserViewSet,
    LeaveViewSet,
    MissionViewSet,
    WorkHoursViewSet,
    InternshipViewSet,
    JobApplicationViewSet,
    api_logout,
    api_signup
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'missions', MissionViewSet)
router.register(r'work-hours', WorkHoursViewSet)
router.register(r'internships', InternshipViewSet)
router.register(r'job-applications', JobApplicationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Authentication endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', api_logout, name='api_logout'),
    path('api/signup/', api_signup, name='api_signup'),
    
    # User endpoints
    path('api/users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
]
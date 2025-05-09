"""
URL configuration for SystemeRH project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from Rh_app.views import (
    UserViewSet, LeaveViewSet, MissionViewSet,
    WorkHoursViewSet, InternshipViewSet, JobApplicationViewSet,
    UserSessionViewSet, MeetingViewSet, NotificationViewSet,
    login_view, api_logout
)
from rest_framework_simplejwt.views import TokenVerifyView
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


from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'RH System API',
        'version': '1.0',
        'status': 'running'
    })

urlpatterns = [
    path('', api_root, name='api_root'),  # API root endpoint
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/verify-token/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/login/', login_view, name='api_login'),
    path('api/auth/logout/', api_logout, name='api_logout'),
]

# Ajouter les URLs pour servir les fichiers média en mode développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
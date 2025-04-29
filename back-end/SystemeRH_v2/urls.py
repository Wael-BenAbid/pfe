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
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from Rh_app.views import (
    UserViewSet, LeaveViewSet, MissionViewSet,
    WorkHoursViewSet, InternshipViewSet, JobApplicationViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'missions', MissionViewSet)
router.register(r'work-hours', WorkHoursViewSet)
router.register(r'internships', InternshipViewSet)
router.register(r'job-applications', JobApplicationViewSet)

def empty_view(request):
    """Vue vide pour les requêtes non gérées"""
    return HttpResponse(status=200)

urlpatterns = [
    path('', empty_view),  # Répond à la racine avec un 200 OK
    path('favicon.ico', empty_view),  # Répond aux requêtes favicon
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
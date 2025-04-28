# Rh_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'leaves', views.LeaveViewSet)
router.register(r'missions', views.MissionViewSet)
router.register(r'work-hours', views.WorkHoursViewSet)
router.register(r'internships', views.InternshipViewSet)
router.register(r'job-applications', views.JobApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Custom user management endpoints
    path('users/request-access/', views.UserViewSet.as_view({'post': 'request_access'}), name='user-request-access'),
    path('users/<int:pk>/approve/', views.UserViewSet.as_view({'post': 'approve_user'}), name='user-approve'),
    path('users/<int:pk>/reject/', views.UserViewSet.as_view({'post': 'reject_user'}), name='user-reject'),
    path('users/me/', views.UserViewSet.as_view({'get': 'me'}), name='user-me'),
    
    # Authentication endpoints grouped under users
    path('users/auth/signup/', views.signup_view, name='signup'),
    path('users/auth/login/', views.login_view, name='login'),
    path('users/auth/logout/', views.logout_view, name='logout'),
    path('users/auth/refresh-token/', views.refresh_token_view, name='refresh-token'),
    path('users/auth/verify-token/', views.verify_token_view, name='verify-token'),
    path('users/auth/reset-password/', views.reset_password_view, name='reset-password'),
    path('users/auth/change-password/', views.change_password_view, name='change-password'),
    path('users/auth/verify-email/', views.verify_email_view, name='verify-email'),
    path('users/auth/resend-verification-email/', views.resend_verification_email_view, name='resend-verification-email'),
    path('users/auth/verify-reset-token/', views.verify_reset_token_view, name='verify-reset-token'),
    path('users/auth/resend-reset-token/', views.resend_reset_token_view, name='resend-reset-token'),
    path('users/auth/update-profile/', views.update_profile_view, name='update-profile'),
    path('users/auth/delete-account/', views.delete_account_view, name='delete-account'),
    path('users/auth/get-user-info/', views.get_user_info_view, name='get-user-info'),
    
    # User balance/history requests
    path('users/auth/get-user-leave-balance/', views.get_user_leave_balance_view, name='get-user-leave-balance'),
    path('users/auth/get-user-leave-history/', views.get_user_leave_history_view, name='get-user-leave-history'),
    path('users/auth/get-user-leave-balance-history/', views.get_user_leave_balance_history_view, name='get-user-leave-balance-history'),
    
    # User-related requests for missions, work hours, internships, etc.
    path('users/auth/get-user-missions/', views.get_user_missions_view, name='get-user-missions'),
    path('users/auth/get-user-work-hours/', views.get_user_work_hours_view, name='get-user-work-hours'),
    path('users/auth/get-user-internships/', views.get_user_internships_view, name='get-user-internships'),
    path('users/auth/get-user-job-applications/', views.get_user_job_applications_view, name='get-user-job-applications'),
    # Other similar endpoints can be grouped similarly
]

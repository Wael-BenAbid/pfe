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
    # Authentication endpoints
    path('auth/signup/', views.signup_view, name='signup'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh-token/', views.refresh_token_view, name='refresh-token'),
    path('auth/verify-token/', views.verify_token_view, name='verify-token'),
    path('auth/reset-password/', views.reset_password_view, name='reset-password'),
    path('auth/change-password/', views.change_password_view, name='change-password'),
    path('auth/verify-email/', views.verify_email_view, name='verify-email'),
    path('auth/resend-verification-email/', views.resend_verification_email_view, name='resend-verification-email'),
    path('auth/verify-reset-token/', views.verify_reset_token_view, name='verify-reset-token'),
    path('auth/resend-reset-token/', views.resend_reset_token_view, name='resend-reset-token'),
    path('auth/update-profile/', views.update_profile_view, name='update-profile'),
    path('auth/delete-account/', views.delete_account_view, name='delete-account'),
    path('auth/get-user-info/', views.get_user_info_view, name='get-user-info'),
    path('auth/get-user-leave-balance/', views.get_user_leave_balance_view, name='get-user-leave-balance'),
    path('auth/get-user-missions/', views.get_user_missions_view, name='get-user-missions'),
    path('auth/get-user-work-hours/', views.get_user_work_hours_view, name='get-user-work-hours'),
    path('auth/get-user-internships/', views.get_user_internships_view, name='get-user-internships'),
    path('auth/get-user-job-applications/', views.get_user_job_applications_view, name='get-user-job-applications'),
    path('auth/get-user-leave-requests/', views.get_user_leave_requests_view, name='get-user-leave-requests'),
    path('auth/get-user-mission-requests/', views.get_user_mission_requests_view, name='get-user-mission-requests'),
    path('auth/get-user-work-hours-requests/', views.get_user_work_hours_requests_view, name='get-user-work-hours-requests'),
    path('auth/get-user-internship-requests/', views.get_user_internship_requests_view, name='get-user-internship-requests'),
    path('auth/get-user-job-application-requests/', views.get_user_job_application_requests_view, name='get-user-job-application-requests'),
    path('auth/get-user-leave-history/', views.get_user_leave_history_view, name='get-user-leave-history'),
    path('auth/get-user-mission-history/', views.get_user_mission_history_view, name='get-user-mission-history'),
    path('auth/get-user-work-hours-history/', views.get_user_work_hours_history_view, name='get-user-work-hours-history'),
    path('auth/get-user-internship-history/', views.get_user_internship_history_view, name='get-user-internship-history'),
    path('auth/get-user-job-application-history/', views.get_user_job_application_history_view, name='get-user-job-application-history'),
    path('auth/get-user-leave-balance-history/', views.get_user_leave_balance_history_view, name='get-user-leave-balance-history'),
    path('auth/get-user-mission-balance-history/', views.get_user_mission_balance_history_view, name='get-user-mission-balance-history'),
    path('auth/get-user-work-hours-balance-history/', views.get_user_work_hours_balance_history_view, name='get-user-work-hours-balance-history'),
    path('auth/get-user-internship-balance-history/', views.get_user_internship_balance_history_view, name='get-user-internship-balance-history'),
    path('auth/get-user-job-application-balance-history/', views.get_user_job_application_balance_history_view, name='get-user-job-application-balance-history'),
    path('auth/get-user-leave-requests-history/', views.get_user_leave_requests_history_view, name='get-user-leave-requests-history'),
    path('auth/get-user-mission-requests-history/', views.get_user_mission_requests_history_view, name='get-user-mission-requests-history'),
    path('auth/get-user-work-hours-requests-history/', views.get_user_work_hours_requests_history_view, name='get-user-work-hours-requests-history'),

]
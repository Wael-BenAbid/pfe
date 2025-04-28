from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Leave, Mission, WorkHours, Internship, JobApplication

# ✅ Custom admin for the User model
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'get_leave_balance', 'is_staff')
    search_fields = ('username', 'email', 'user_type', 'leave_balance')  # Ajout d'un champ de recherche
    
    def get_leave_balance(self, obj):
        return obj.leave_balance
    get_leave_balance.short_description = 'Solde congés'

    list_filter = ('user_type', 'is_staff', 'is_superuser')

    fieldsets = list(UserAdmin.fieldsets)
    fieldsets[1] = ('Informations personnelles', {
        'fields': ('first_name', 'last_name', 'email', 'user_type', 'leave_balance')
    })

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('user_type', 'leave_balance'),
        }),
    )

admin.site.register(User, CustomUserAdmin)


# ✅ Leave model admin
@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'user__user_type')
    search_fields = ('user__username', 'reason')
    date_hierarchy = 'start_date'

# ✅ Mission model admin
@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_to', 'supervisor', 'deadline', 'completed')
    list_filter = ('completed', 'assigned_to__user_type')
    search_fields = ('title', 'description', 'assigned_to__username')
    date_hierarchy = 'deadline'

# ✅ WorkHours model admin
@admin.register(WorkHours)
class WorkHoursAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'hours_worked')
    list_filter = ('user__user_type',)
    search_fields = ('user__username',)
    date_hierarchy = 'date'

# ✅ Internship model admin
@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('intern', 'supervisor', 'start_date', 'end_date', 'status')
    list_filter = ('status',)
    search_fields = ('intern__username', 'supervisor__username')
    date_hierarchy = 'start_date'

# ✅ JobApplication model admin
@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'position', 'application_type', 'status')
    list_filter = ('status', 'application_type')
    search_fields = ('first_name', 'last_name', 'email', 'position')
    date_hierarchy = 'created_at'

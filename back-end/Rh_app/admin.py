from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession

# ✅ Action personnalisée pour approuver les utilisateurs
@admin.action(description="Approuver les utilisateurs sélectionnés")
def approve_users(modeladmin, request, queryset):
    updated = queryset.update(approved=True)
    modeladmin.message_user(request, f"{updated} utilisateur(s) approuvé(s).")

# ✅ Custom admin pour le modèle User
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'user_type', 'get_leave_balance', 'approved', 'is_staff')
    search_fields = ('username', 'email', 'user_type')  # leave_balance n'est pas un champ textuel, donc retiré ici
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'approved')
    actions = [approve_users]  # Ajout de l'action personnalisée

    def get_leave_balance(self, obj):
        return obj.leave_balance
    get_leave_balance.short_description = 'Solde congés'

    fieldsets = list(BaseUserAdmin.fieldsets)
    fieldsets[1] = ('Informations personnelles', {
        'fields': ('first_name', 'last_name', 'email', 'user_type', 'leave_balance', 'approved')
    })

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('user_type', 'leave_balance', 'approved'),
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

# ✅ UserSession model admin
@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'login_time', 'logout_time', 'is_active', 'get_duration')
    list_filter = ('is_active', 'user__user_type')
    search_fields = ('user__username',)
    date_hierarchy = 'login_time'

    def get_duration(self, obj):
        return f"{obj.calculate_duration()} hours" if obj.logout_time else "Active"
    get_duration.short_description = 'Duration'

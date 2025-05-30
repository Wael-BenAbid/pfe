# Configuration d'administration Django pour le Système RH
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

# Configuration de l'interface d'administration
admin.site.site_header = "Système RH - Administration"
admin.site.site_title = "RH Admin"
admin.site.index_title = "Panneau d'administration du Système RH"

# Personnalisation de l'admin pour les utilisateurs
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    readonly_fields = ('date_joined', 'last_login')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informations RH', {
            'fields': ('date_joined', 'last_login'),
        }),
    )

# Réenregistrer le modèle User avec la configuration personnalisée
try:
    admin.site.unregister(User)
    admin.site.register(User, CustomUserAdmin)
except admin.sites.AlreadyRegistered:
    pass

# Configuration globale de l'admin
admin.site.empty_value_display = '(Aucune valeur)'

print("Configuration d'administration chargée avec succès")

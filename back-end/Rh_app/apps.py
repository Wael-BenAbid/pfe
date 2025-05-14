from django.apps import AppConfig


class RhAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Rh_app'

    def ready(self):
        # Import des signaux
        import Rh_app.signals

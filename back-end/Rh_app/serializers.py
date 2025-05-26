from rest_framework import serializers
from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession, Meeting, Notification, SystemActivity, Message

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'user_type', 'leave_balance',
                 'first_name', 'last_name', 'approved', 'profile_image', 'github_profile')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'employee'),
            leave_balance=validated_data.get('leave_balance', 30),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            profile_image=validated_data.get('profile_image', None),
            github_profile=validated_data.get('github_profile', None)
        )
        return user

class LeaveSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Leave
        fields = '__all__'

    def validate_attachment(self, value):
        """
        Valider que le fichier attaché est un PDF, une image ou un document Word
        """
        if value:
            # Obtenir l'extension du fichier
            file_extension = value.name.split('.')[-1].lower()

            # Liste des extensions autorisées
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx']

            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Le type de fichier n'est pas autorisé. Les types autorisés sont : {', '.join(allowed_extensions)}"
                )

            # Limiter la taille du fichier à 5 Mo
            if value.size > 5 * 1024 * 1024:  # 5 Mo en octets
                raise serializers.ValidationError("La taille du fichier ne doit pas dépasser 5 Mo.")

        return value

class MissionSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    supervisor_name = serializers.SerializerMethodField()
    assigned_to_full_name = serializers.SerializerMethodField()
    work_duration_display = serializers.SerializerMethodField()
    supervisor_full_name = serializers.SerializerMethodField()

    # Rendre le champ supervisor optionnel
    supervisor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    # Rendre les champs d'attachement optionnels
    attachment_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    attachment_file = serializers.FileField(required=False, allow_null=True)
    completion_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Mission
        fields = '__all__'

    def get_supervisor_name(self, obj):
        if obj.supervisor:
            return obj.supervisor.username
        return None

    def get_supervisor_full_name(self, obj):
        if obj.supervisor:
            return f"{obj.supervisor.first_name} {obj.supervisor.last_name}"
        return None

    def get_assigned_to_full_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"
        return None

    def get_work_duration_display(self, obj):
        if obj.work_duration:
            total_seconds = obj.work_duration.total_seconds()
            days = total_seconds // 86400
            hours = (total_seconds % 86400) // 3600
            minutes = (total_seconds % 3600) // 60

            if days > 0:
                return f"{int(days)} jours, {int(hours)} heures, {int(minutes)} minutes"
            elif hours > 0:
                return f"{int(hours)} heures, {int(minutes)} minutes"
            else:
                return f"{int(minutes)} minutes"
        return None

class WorkHoursSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = WorkHours
        fields = '__all__'

class InternshipSerializer(serializers.ModelSerializer):
    intern_name = serializers.ReadOnlyField(source='intern.username')
    supervisor_name = serializers.ReadOnlyField(source='supervisor.username')
    intern_details = serializers.SerializerMethodField()
    supervisor_details = serializers.SerializerMethodField()

    class Meta:
        model = Internship
        fields = '__all__'

    def get_intern_details(self, obj):
        if obj.intern:
            return {
                'id': obj.intern.id,
                'first_name': obj.intern.first_name,
                'last_name': obj.intern.last_name,
                'email': obj.intern.email,
                'profile_image': obj.intern.profile_image.url if obj.intern.profile_image else None,
                'github_profile': obj.intern.github_profile,
                'user_type': obj.intern.user_type
            }
        return None

    def get_supervisor_details(self, obj):
        if obj.supervisor:
            return {
                'id': obj.supervisor.id,
                'first_name': obj.supervisor.first_name,
                'last_name': obj.supervisor.last_name,
                'email': obj.supervisor.email,
                'profile_image': obj.supervisor.profile_image.url if obj.supervisor.profile_image else None,
                'github_profile': obj.supervisor.github_profile,
                'user_type': obj.supervisor.user_type
            }
        return None

class JobApplicationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'application_type', 'position', 'first_name', 'last_name', 'username',
            'email', 'phone', 'education', 'experience', 'motivation', 'cv_file',
            'github_profile', 'profile_image', 'status', 'created_at', 'user', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True},
                       'github_profile': {'required': False},
                       'profile_image': {'required': False}}

class UserSessionSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = ['id', 'user', 'login_time', 'logout_time', 'is_active', 'duration_hours']

    def get_duration_hours(self, obj):
        if obj.logout_time:
            return obj.calculate_duration()
        return None


class MeetingSerializer(serializers.ModelSerializer):
    organizer_name = serializers.ReadOnlyField(source='organizer.username')
    organizer_full_name = serializers.SerializerMethodField()
    participants_details = serializers.SerializerMethodField()

    # Rendre les champs organizer et participants optionnels
    organizer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False
    )
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Meeting
        fields = '__all__'

    def get_organizer_full_name(self, obj):
        return f"{obj.organizer.first_name} {obj.organizer.last_name}"

    def get_participants_details(self, obj):
        return [
            {
                'id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}",
                'user_type': user.user_type
            }
            for user in obj.participants.all()
        ]


class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Notification
        fields = ['id', 'user', 'user_name', 'title', 'message', 'type', 'read', 'created_at']


class SystemActivitySerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    action_display = serializers.ReadOnlyField(source='get_action_type_display')
    formatted_date = serializers.SerializerMethodField()

    class Meta:
        model = SystemActivity
        fields = ['id', 'action_type', 'action_display', 'action', 'user', 'user_email', 'user_name',
                 'ip_address', 'details', 'resource_type', 'resource_id', 'created_at', 'formatted_date']

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "System"

    def get_formatted_date(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_type = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    recipient_type = serializers.SerializerMethodField()
    formatted_date = serializers.ReadOnlyField()
    content = serializers.CharField(allow_blank=True)  # Permettre un contenu vide

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_type', 'recipient', 'recipient_name',
                  'recipient_type', 'content', 'is_important', 'is_read', 'created_at', 'formatted_date',
                  'attachment', 'attachment_name', 'attachment_type']
        read_only_fields = ['sender', 'created_at', 'formatted_date']

    def validate(self, data):
        """
        Valider que l'utilisateur peut envoyer un message au destinataire selon les règles :
        - Admin peut contacter tout le monde
        - Employé peut contacter admin, autres employés et ses stagiaires
        - Stagiaire peut contacter admin et son employé superviseur
        """
        sender = self.context['request'].user
        recipient = data.get('recipient')

        if not recipient:
            raise serializers.ValidationError("Le destinataire est requis.")

        # Vérifier si une pièce jointe est présente dans la requête
        request = self.context.get('request')
        has_attachment = request and request.FILES and 'attachment' in request.FILES

        # Si le contenu est vide et qu'il n'y a pas de pièce jointe, lever une erreur
        if not data.get('content', '').strip() and not has_attachment:
            raise serializers.ValidationError("Le message doit contenir du texte ou une pièce jointe.")

        # Admin peut contacter tout le monde
        if sender.user_type == 'admin':
            return data

        # Employé peut contacter admin, autres employés et ses stagiaires
        elif sender.user_type == 'employee':
            # Vérifier si le destinataire est un admin
            if recipient.user_type == 'admin':
                return data

            # Vérifier si le destinataire est un autre employé
            if recipient.user_type == 'employee':
                return data

            # Vérifier si le destinataire est un de ses stagiaires
            if recipient.user_type == 'intern':
                # Vérifier si l'employé est le superviseur du stagiaire
                internship = Internship.objects.filter(supervisor=sender, intern=recipient).first()
                if internship:
                    return data
                else:
                    raise serializers.ValidationError("Vous ne pouvez pas envoyer de message à ce stagiaire car vous n'êtes pas son superviseur.")

            raise serializers.ValidationError("Vous ne pouvez pas envoyer de message à ce destinataire.")

        # Stagiaire peut contacter admin et son employé superviseur
        elif sender.user_type == 'intern':
            # Vérifier si le destinataire est un admin
            if recipient.user_type == 'admin':
                return data

            # Vérifier si le destinataire est son employé superviseur
            if recipient.user_type == 'employee':
                # Vérifier si l'employé est le superviseur du stagiaire
                internship = Internship.objects.filter(supervisor=recipient, intern=sender).first()
                if internship:
                    return data
                else:
                    raise serializers.ValidationError("Vous ne pouvez pas envoyer de message à cet employé car il n'est pas votre superviseur.")

            raise serializers.ValidationError("Vous ne pouvez pas envoyer de message à ce destinataire.")

        return data

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_sender_type(self, obj):
        return obj.sender.user_type

    def get_recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}"

    def get_recipient_type(self, obj):
        return obj.recipient.user_type

    def validate_attachment(self, value):
        """
        Valider que le fichier attaché est un PDF, une image ou un document Word
        """
        if value:
            # Obtenir l'extension du fichier
            file_extension = value.name.split('.')[-1].lower()

            # Liste des extensions autorisées
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx']

            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Le type de fichier n'est pas autorisé. Les types autorisés sont : {', '.join(allowed_extensions)}"
                )

            # Limiter la taille du fichier à 5 Mo
            if value.size > 5 * 1024 * 1024:  # 5 Mo en octets
                raise serializers.ValidationError("La taille du fichier ne doit pas dépasser 5 Mo.")

        return value
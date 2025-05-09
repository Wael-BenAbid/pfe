from rest_framework import serializers
from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession, Meeting, Notification, SystemActivity

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

class MissionSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    supervisor_name = serializers.SerializerMethodField()
    assigned_to_full_name = serializers.SerializerMethodField()
    work_duration_display = serializers.SerializerMethodField()

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

    class Meta:
        model = Internship
        fields = '__all__'

class JobApplicationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'application_type', 'position', 'first_name', 'last_name',
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
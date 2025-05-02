from rest_framework import serializers
from .models import User, Leave, Mission, WorkHours, Internship, JobApplication, UserSession

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'user_type', 'leave_balance', 'first_name', 'last_name','approved')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'employee'),
            leave_balance=validated_data.get('leave_balance', 30),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class LeaveSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Leave
        fields = '__all__'

class MissionSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    supervisor_name = serializers.ReadOnlyField(source='supervisor.username')

    class Meta:
        model = Mission
        fields = '__all__'

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
    class Meta:
        model = JobApplication
        fields = [
            'id', 'application_type', 'position', 'first_name', 'last_name',
            'email', 'phone', 'education', 'experience', 'motivation', 'cv_file',
            'status', 'created_at', 'user'
        ]

class UserSessionSerializer(serializers.ModelSerializer):
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = ['id', 'user', 'login_time', 'logout_time', 'is_active', 'duration_hours']

    def get_duration_hours(self, obj):
        if obj.logout_time:
            return obj.calculate_duration()
        return None
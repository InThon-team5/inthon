from rest_framework import serializers
from users.models import User
from problems.models import Problem
from .models import BattleStatus, BattleRoom, BattleResult


class BattleStatusSerializer(serializers.ModelSerializer):
    """대결상태 Serializer"""
    class Meta:
        model = BattleStatus
        fields = ('id', 'name')


class UserSimpleSerializer(serializers.ModelSerializer):
    """사용자 간단 정보 Serializer"""
    class Meta:
        model = User
        fields = ('id', 'email')


class ProblemSimpleSerializer(serializers.ModelSerializer):
    """문제 간단 정보 Serializer"""
    class Meta:
        model = Problem
        fields = ('id', 'title', 'description')


class BattleRoomListSerializer(serializers.ModelSerializer):
    """대결방 목록 조회용 Serializer"""
    host = UserSimpleSerializer(read_only=True)
    status = BattleStatusSerializer(read_only=True)
    problems = ProblemSimpleSerializer(many=True, read_only=True)
    
    class Meta:
        model = BattleRoom
        fields = (
            'id', 'title', 'is_cote', 'host', 'status',
            'is_private', 'problems'
        )


class BattleRoomDetailSerializer(serializers.ModelSerializer):
    """대결방 상세 조회용 Serializer"""
    host = UserSimpleSerializer(read_only=True)
    status = BattleStatusSerializer(read_only=True)
    problems = ProblemSimpleSerializer(many=True, read_only=True)
    
    class Meta:
        model = BattleRoom
        fields = (
            'id', 'title', 'is_cote', 'host', 'status',
            'is_private', 'private_password', 'problems'
        )


class BattleRoomCreateSerializer(serializers.ModelSerializer):
    """대결방 생성용 Serializer"""
    problems = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Problem.objects.all(),
        required=False
    )
    
    class Meta:
        model = BattleRoom
        fields = (
            'title', 'is_cote', 'is_private',
            'private_password', 'problems'
        )
        # status는 자동으로 '대기'로 설정됨
    
    def validate(self, data):
        """비공개 방인 경우 비밀번호 필수 및 4자리 숫자 검증"""
        private_password = data.get('private_password')
        
        if data.get('is_private'):
            if not private_password:
                raise serializers.ValidationError({
                    'private_password': '비공개 방인 경우 비밀번호가 필요합니다.'
                })
            # 4자리 숫자 검증
            if not isinstance(private_password, str) or not private_password.isdigit():
                raise serializers.ValidationError({
                    'private_password': '비밀번호는 4자리 숫자여야 합니다.'
                })
            if len(private_password) != 4:
                raise serializers.ValidationError({
                    'private_password': '비밀번호는 정확히 4자리여야 합니다.'
                })
        else:
            if private_password:
                raise serializers.ValidationError({
                    'private_password': '공개 방에는 비밀번호를 설정할 수 없습니다.'
                })
        return data


class BattleRoomStatusUpdateSerializer(serializers.ModelSerializer):
    """대결방 상태 변경용 Serializer"""
    class Meta:
        model = BattleRoom
        fields = ('status',)


class PasswordVerifySerializer(serializers.Serializer):
    """비밀번호 확인용 Serializer (4자리 숫자 문자열)"""
    password = serializers.CharField(
        max_length=4,
        min_length=4,
        help_text="4자리 숫자 비밀번호"
    )
    
    def validate_password(self, value):
        """4자리 숫자만 허용"""
        if not value.isdigit():
            raise serializers.ValidationError("비밀번호는 숫자만 입력 가능합니다.")
        if len(value) != 4:
            raise serializers.ValidationError("비밀번호는 4자리여야 합니다.")
        return value


class BattleResultSubmitSerializer(serializers.Serializer):
    """대결 결과 제출용 Serializer"""
    remaining_time_percent = serializers.IntegerField(
        min_value=0,
        max_value=100,
        help_text="남은 시간 퍼센트 (0-100)"
    )
    accuracy_percent = serializers.IntegerField(
        min_value=0,
        max_value=100,
        help_text="정답률 퍼센트 (0-100)"
    )


class BattleResultSerializer(serializers.ModelSerializer):
    """대결 결과 조회용 Serializer"""
    user = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = BattleResult
        fields = (
            'id', 'user', 'remaining_time_percent', 'accuracy_percent',
            'total_score', 'result', 'submitted_at'
        )



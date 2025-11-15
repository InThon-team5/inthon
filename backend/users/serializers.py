from rest_framework import serializers
from .models import User, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserCreateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        # 회원가입 시 이메일과 비밀번호만 받음
        fields = ('email', 'password')
        extra_kwargs = {
            # 비밀번호는 응답에 포함시키지 않도록 설정
            'password': {'write_only': True} 
        }

    def validate_email(self, value):
        """
        [핵심] 이메일 유효성 검사
        - @korea.ac.kr 로 끝나는지 확인
        - 이미 가입된 이메일인지 확인
        """
        # 1. @korea.ac.kr 검사
        if not value.endswith('@korea.ac.kr'):
            raise serializers.ValidationError("고려대학교 이메일(@korea.ac.kr)만 가입할 수 있습니다.")
        
        # 2. 이메일 중복 검사
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
            
        return value

    def create(self, validated_data):
        """
        검증이 완료된 데이터로 User 객체를 생성
        """
        # models.py에 정의한 CustomUserManager의 create_user 사용
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        Profile.objects.create(user=user)
        
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # 1. 기본 토큰 생성 (access, refresh)
        token = super().get_token(user)

        # 2. (선택) 토큰 Payload에 추가할 커스텀 정보
        #    - user 객체에서 원하는 정보를 가져와 'claims'로 추가
        token['email'] = user.email
        
        # (주의!) user.profile.nickname은 Profile이 있어야만 접근 가능
        try:
            token['nickname'] = user.profile.nickname
        except Profile.DoesNotExist:
            token['nickname'] = None # 프로필이 아직 없으면 null
        
        return token
from rest_framework import serializers
from .models import User, Profile, Title, TechStack, Club
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserCreateSerializer(serializers.ModelSerializer):
    # 이메일 필드를 명시적으로 정의하여 UniqueValidator 제거
    # validate_email에서 중복 검사를 수행하므로 UniqueValidator는 불필요
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': '이메일을 입력해주세요.',
            'blank': '이메일을 입력해주세요.',
            'null': '이메일을 입력해주세요.',
            'invalid': '올바른 이메일 형식이 아닙니다.',
        },
        validators=[]  # UniqueValidator 제거 (validate_email에서 처리)
    )
    
    nickname = serializers.CharField(
        max_length=50,
        required=True,
        write_only=True,
        help_text="닉네임 (필수)",
        error_messages={
            'required': '닉네임을 입력해주세요.',
            'blank': '닉네임을 입력해주세요.',
            'null': '닉네임을 입력해주세요.',
        }
    )
    
    class Meta:
        model = User
        # 회원가입 시 이메일, 비밀번호, 닉네임을 받음
        fields = ('email', 'password', 'nickname')
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
    
    def validate_nickname(self, value):
        """
        닉네임 유효성 검사
        - 닉네임 중복 검사
        """
        # 빈 문자열 체크
        if not value or not value.strip():
            raise serializers.ValidationError("닉네임을 입력해주세요.")
        
        # 공백 제거된 닉네임
        value = value.strip()
        
        # 닉네임 중복 검사
        if Profile.objects.filter(nickname=value).exists():
            raise serializers.ValidationError("이미 사용 중인 닉네임입니다.")
        
        return value

    def create(self, validated_data):
        """
        검증이 완료된 데이터로 User 객체와 Profile 객체를 생성
        """
        # nickname을 validated_data에서 분리 (User 모델에 없는 필드이므로)
        nickname = validated_data.pop('nickname')
        
        # models.py에 정의한 CustomUserManager의 create_user 사용
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Profile 생성 시 nickname 설정
        Profile.objects.create(user=user, nickname=nickname)
        
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


# ---------- Profile Serializers ----------

class TitleSerializer(serializers.ModelSerializer):
    """칭호 Serializer"""
    class Meta:
        model = Title
        fields = ('id', 'name')


class TechStackSerializer(serializers.ModelSerializer):
    """기술스택 Serializer"""
    class Meta:
        model = TechStack
        fields = ('id', 'name')


class ClubSerializer(serializers.ModelSerializer):
    """동아리 Serializer"""
    class Meta:
        model = Club
        fields = ('id', 'name')


class UserSimpleSerializer(serializers.ModelSerializer):
    """User 간단 정보 Serializer"""
    class Meta:
        model = User
        fields = ('id', 'email')


class ProfileSerializer(serializers.ModelSerializer):
    """프로필 Serializer (조회용)"""
    user = UserSimpleSerializer(read_only=True)
    activate_title = TitleSerializer(read_only=True)
    titles = TitleSerializer(many=True, read_only=True)
    tech_stacks = TechStackSerializer(many=True, read_only=True)
    clubs = ClubSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = (
            'id', 'user', 'student_id', 'nickname', 'rating', 'tier',
            'activate_title', 'titles', 'tech_stacks', 'clubs'
        )
        read_only_fields = ('id', 'rating')


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """프로필 수정용 Serializer"""
    # M2M 필드는 ID 리스트로 받음
    title_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Title.objects.all(),
        source='titles',
        required=False,
        allow_null=True
    )
    tech_stack_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TechStack.objects.all(),
        source='tech_stacks',
        required=False,
        allow_null=True
    )
    club_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Club.objects.all(),
        source='clubs',
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Profile
        fields = (
            'student_id', 'nickname', 'tier', 'activate_title',
            'title_ids', 'tech_stack_ids', 'club_ids'
        )
    
    def update(self, instance, validated_data):
        # M2M 필드 분리
        titles = validated_data.pop('titles', None)
        tech_stacks = validated_data.pop('tech_stacks', None)
        clubs = validated_data.pop('clubs', None)
        
        # activate_title이 빈 값으로 오면 None으로 설정
        if 'activate_title' in validated_data and validated_data['activate_title'] is None:
            instance.activate_title = None
        
        # 나머지 필드 업데이트
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # M2M 필드 업데이트 (값이 제공된 경우에만)
        if titles is not None:
            instance.titles.set(titles)
        if tech_stacks is not None:
            instance.tech_stacks.set(tech_stacks)
        if clubs is not None:
            instance.clubs.set(clubs)
        
        return instance
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class CustomUserManager(BaseUserManager):
    """
    [새로 추가] 커스텀 유저 매니저
    username 대신 email을 사용하도록 create_user와 create_superuser를 수정합니다.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        일반 유저 생성
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        슈퍼 유저 생성
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # create_user 함수를 호출하여 슈퍼유저 생성
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    사용자 모델 (Custom User Model)
    """
    username = None # username 필드 제거
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    # [수정] User 모델이 사용할 매니저를 CustomUserManager로 지정합니다.
    objects = CustomUserManager()
    
    class Meta:
        db_table = '사용자'

    def __str__(self):
        return self.email


class Title(models.Model):
    """칭호 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '칭호'
    
    def __str__(self):
        return self.name


class TechStack(models.Model):
    """기술스택 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '기술스택'
    
    def __str__(self):
        return self.name


class Club(models.Model):
    """동아리 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '동아리'
    
    def __str__(self):
        return self.name


class Profile(models.Model):
    """
    프로필 모델
    - User 모델과 1:1 관계를 맺습니다.
    - 인증 외의 모든 추가 사용자 정보를 관리합니다.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    # [수정됨] student_id를 User에서 Profile로 이동
    student_id = models.IntegerField(null=True, blank=True)
    nickname = models.CharField(max_length=50, null=True, blank=True)
    rating = models.IntegerField(default=0)
    tier = models.CharField(max_length=50, null=True, blank=True)
    
    # 활성화된 칭호 (Profile이 Title을 N:1로 참조)
    activate_title = models.ForeignKey(
        Title,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_profiles'
    )
    # 보유 칭호 목록 (Profile과 Title의 M:M 관계)
    titles = models.ManyToManyField(
        Title,
        related_name='profiles',
        blank=True
    )
    # 기술 스택 (Profile과 TechStack의 M:M 관계)
    tech_stacks = models.ManyToManyField(
        TechStack,
        related_name='profiles',
        blank=True
    )
    # 동아리 (Profile과 Club의 M:M 관계)
    clubs = models.ManyToManyField(
        Club,
        related_name='profiles',
        blank=True
    )
    
    class Meta:
        db_table = '프로필'
    
    def __str__(self):
        # User 모델의 __str__이 email을 반환하므로 self.user.email과 동일
        return f"{self.user}의 프로필"
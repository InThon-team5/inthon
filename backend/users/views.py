from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import (
    UserCreateSerializer, MyTokenObtainPairSerializer,
    ProfileSerializer, ProfileUpdateSerializer,
    TitleSerializer, TechStackSerializer, ClubSerializer
)
from .models import User, Profile, Title, TechStack, Club
from rest_framework_simplejwt.views import TokenObtainPairView

class UserCreateView(generics.CreateAPIView):
    """
    회원가입 API 뷰 (POST 요청만 처리)
    (POST /api/users/signup/)
    """
    # 이 View가 사용할 Serializer를 지정
    serializer_class = UserCreateSerializer
    # 이 View가 다룰 모델을 지정 (필수는 아니나, 명시적으로)
    queryset = User.objects.all()

class MyTokenObtainPairView(TokenObtainPairView):
    """
    로그인 (POST /api/users/login/)
    (JWT 토큰 발급)
    """
    serializer_class = MyTokenObtainPairSerializer


# ---------- Profile Views ----------

class ProfileRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
    내 프로필 조회 및 수정
    GET /api/profile/ - 내 프로필 조회
    PATCH /api/profile/ - 내 프로필 수정
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    
    def get_object(self):
        """현재 로그인한 사용자의 프로필 반환"""
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get_serializer_class(self):
        """요청 메서드에 따라 다른 Serializer 사용"""
        if self.request.method == 'PATCH' or self.request.method == 'PUT':
            return ProfileUpdateSerializer
        return ProfileSerializer


class ProfileDetailView(generics.RetrieveAPIView):
    """
    다른 사용자 프로필 조회
    GET /api/profile/{id}/ - 특정 사용자 프로필 조회
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    lookup_field = 'id'


# ---------- Reference Data Views ----------

class TitleListView(generics.ListAPIView):
    """칭호 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = TitleSerializer
    queryset = Title.objects.all()


class TechStackListView(generics.ListAPIView):
    """기술스택 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = TechStackSerializer
    queryset = TechStack.objects.all()


class ClubListView(generics.ListAPIView):
    """동아리 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = ClubSerializer
    queryset = Club.objects.all()
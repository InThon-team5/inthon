from rest_framework import generics
from .serializers import UserCreateSerializer, MyTokenObtainPairSerializer
from .models import User
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
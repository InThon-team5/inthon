from rest_framework import generics
from .serializers import UserCreateSerializer
from .models import User # User 모델도 임포트 (Serializer가 사용하긴 하지만 명시적)

class UserCreateView(generics.CreateAPIView):
    """
    회원가입 API 뷰 (POST 요청만 처리)
    (POST /api/users/signup/)
    """
    # 이 View가 사용할 Serializer를 지정
    serializer_class = UserCreateSerializer
    # 이 View가 다룰 모델을 지정 (필수는 아니나, 명시적으로)
    queryset = User.objects.all()

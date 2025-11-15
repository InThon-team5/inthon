from django.urls import path
from .views import UserCreateView, MyTokenObtainPairView

urlpatterns = [
    # POST /api/users/signup/ 경로로 요청이 오면 UserCreateView를 실행
    path('signup/', UserCreateView.as_view(), name='user-signup'),
    # POST /api/users/login/ (JWT 토큰 발급)
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
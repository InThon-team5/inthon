from django.urls import path
from .views import UserCreateView

urlpatterns = [
    # POST /api/users/signup/ 경로로 요청이 오면 UserCreateView를 실행
    path('signup/', UserCreateView.as_view(), name='user-signup'),
]
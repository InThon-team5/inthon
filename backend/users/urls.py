from django.urls import path
from .views import (
    UserCreateView, MyTokenObtainPairView,
    ProfileRetrieveUpdateView, ProfileDetailView,
    TitleListView, TechStackListView, ClubListView
)

urlpatterns = [
    # ---------- User Auth ----------
    # POST /api/users/signup/ 경로로 요청이 오면 UserCreateView를 실행
    path('users/signup/', UserCreateView.as_view(), name='user-signup'),
    # POST /api/users/login/ (JWT 토큰 발급)
    path('users/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # ---------- Profile ----------
    # GET /api/profile/ - 내 프로필 조회
    # PATCH /api/profile/ - 내 프로필 수정
    path('profile/', ProfileRetrieveUpdateView.as_view(), name='profile-retrieve-update'),
    # GET /api/profile/{id}/ - 특정 사용자 프로필 조회
    path('profile/<int:id>/', ProfileDetailView.as_view(), name='profile-detail'),
    
    # ---------- Reference Data ----------
    # GET /api/titles/ - 칭호 목록
    path('titles/', TitleListView.as_view(), name='title-list'),
    # GET /api/tech-stacks/ - 기술스택 목록
    path('tech-stacks/', TechStackListView.as_view(), name='tech-stack-list'),
    # GET /api/clubs/ - 동아리 목록
    path('clubs/', ClubListView.as_view(), name='club-list'),
]
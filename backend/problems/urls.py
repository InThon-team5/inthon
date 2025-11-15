from django.urls import path
from .views import (
    TypeListView, SubjectListView,
    ProblemListView, ProblemDetailView
)

urlpatterns = [
    # ---------- Reference Data ----------
    # GET /api/types/ - 종류 목록
    path('types/', TypeListView.as_view(), name='type-list'),
    # GET /api/subjects/ - 과목 목록
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
    
    # ---------- Problems ----------
    # GET /api/problems/ - 문제 목록 (필터링: ?type_name={name}&subject_name={name})
    path('problems/', ProblemListView.as_view(), name='problem-list'),
    # GET /api/problems/{id}/ - 문제 상세 조회
    path('problems/<int:id>/', ProblemDetailView.as_view(), name='problem-detail'),
]


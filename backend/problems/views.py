from rest_framework import generics
from rest_framework.permissions import AllowAny
from urllib.parse import unquote

from .models import Type, Subject, Problem
from .serializers import (
    TypeSerializer, SubjectSerializer,
    ProblemListSerializer, ProblemDetailSerializer
)


# ---------- Reference Data Views ----------

class TypeListView(generics.ListAPIView):
    """종류 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = TypeSerializer
    queryset = Type.objects.all()


class SubjectListView(generics.ListAPIView):
    """과목 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()


# ---------- Problem Views ----------

class ProblemListView(generics.ListAPIView):
    """문제 목록 조회 (필터링: type_name, subject_name)"""
    permission_classes = [AllowAny]
    serializer_class = ProblemListSerializer
    
    def get_queryset(self):
        queryset = Problem.objects.select_related('type', 'subject').all()
        
        # 쿼리 파라미터로 필터링 (이름으로 받아서 id로 변환)
        # 한글 등 URL 인코딩된 값도 처리하기 위해 unquote 사용
        type_name = self.request.query_params.get('type_name', None)
        subject_name = self.request.query_params.get('subject_name', None)
        
        if type_name:
            # URL 디코딩 처리 (한글 등 특수문자 처리)
            type_name = unquote(type_name)
            # 이름으로 Type 찾기
            type_obj = Type.objects.filter(name=type_name).first()
            if type_obj:
                queryset = queryset.filter(type=type_obj)
            else:
                # 존재하지 않는 이름이면 빈 결과 반환
                return Problem.objects.none()
        
        if subject_name:
            # URL 디코딩 처리 (한글 등 특수문자 처리)
            subject_name = unquote(subject_name)
            # 이름으로 Subject 찾기
            subject_obj = Subject.objects.filter(name=subject_name).first()
            if subject_obj:
                queryset = queryset.filter(subject=subject_obj)
            else:
                # 존재하지 않는 이름이면 빈 결과 반환
                return Problem.objects.none()
        
        return queryset


class ProblemDetailView(generics.RetrieveAPIView):
    """문제 상세 조회 (정답 포함)"""
    permission_classes = [AllowAny]
    serializer_class = ProblemDetailSerializer
    queryset = Problem.objects.select_related('type', 'subject').all()
    lookup_field = 'id'

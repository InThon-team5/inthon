from rest_framework import serializers
from .models import Type, Subject, Problem


class TypeSerializer(serializers.ModelSerializer):
    """종류 Serializer"""
    class Meta:
        model = Type
        fields = ('id', 'name')


class SubjectSerializer(serializers.ModelSerializer):
    """과목 Serializer"""
    class Meta:
        model = Subject
        fields = ('id', 'name')


class ProblemListSerializer(serializers.ModelSerializer):
    """문제 목록 조회용 Serializer (정답 제외)"""
    type = TypeSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    
    class Meta:
        model = Problem
        fields = ('id', 'title', 'description', 'type', 'subject')
        # correct_answer는 제외


class ProblemDetailSerializer(serializers.ModelSerializer):
    """문제 상세 조회용 Serializer (정답 포함)"""
    type = TypeSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    
    class Meta:
        model = Problem
        fields = ('id', 'title', 'description', 'type', 'subject', 'correct_answer')


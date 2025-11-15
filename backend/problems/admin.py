from django.contrib import admin
from .models import Type, Subject, Problem


@admin.register(Type)
class TypeAdmin(admin.ModelAdmin):
    """종류 Admin 설정"""
    list_display = ('id', 'name',)
    search_fields = ('name',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    """과목 Admin 설정"""
    list_display = ('id', 'name',)
    search_fields = ('name',)


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    """문제 Admin 설정"""
    list_display = ('id', 'title', 'type', 'subject', 'correct_answer')
    list_filter = ('type', 'subject')
    search_fields = ('title', 'description', 'correct_answer')
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'description')
        }),
        ('분류', {
            'fields': ('type', 'subject')
        }),
        ('정답', {
            'fields': ('correct_answer',)
        }),
    )

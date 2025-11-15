from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, Title, TechStack, Club, Friendship


class ProfileInline(admin.StackedInline):
    """User admin에 Profile을 인라인으로 표시"""
    model = Profile
    can_delete = False
    verbose_name_plural = '프로필'
    fields = ('student_id', 'nickname', 'rating', 'tier', 'activate_title', 'titles', 'tech_stacks', 'clubs')
    filter_horizontal = ('titles', 'tech_stacks', 'clubs')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """커스텀 User 모델을 위한 Admin 설정"""
    # username 필드 제거, email을 기본 필드로 사용
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('권한', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('중요한 날짜', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    list_display = ('email', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('email',)
    ordering = ('email',)
    inlines = [ProfileInline]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """프로필 Admin 설정"""
    list_display = ('user', 'nickname', 'student_id', 'rating', 'tier', 'activate_title')
    list_filter = ('tier', 'activate_title', 'rating')
    search_fields = ('user__email', 'nickname', 'student_id')
    filter_horizontal = ('titles', 'tech_stacks', 'clubs')
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'student_id', 'nickname', 'rating', 'tier')
        }),
        ('칭호', {
            'fields': ('activate_title', 'titles')
        }),
        ('기술 및 동아리', {
            'fields': ('tech_stacks', 'clubs')
        }),
    )


@admin.register(Title)
class TitleAdmin(admin.ModelAdmin):
    """칭호 Admin 설정"""
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(TechStack)
class TechStackAdmin(admin.ModelAdmin):
    """기술스택 Admin 설정"""
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    """동아리 Admin 설정"""
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    """친구관계 Admin 설정"""
    list_display = ('from_profile', 'to_profile', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('from_profile__user__email', 'to_profile__user__email', 'from_profile__nickname', 'to_profile__nickname')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('친구 관계', {
            'fields': ('from_profile', 'to_profile', 'status')
        }),
        ('날짜 정보', {
            'fields': ('created_at', 'updated_at')
        }),
    )

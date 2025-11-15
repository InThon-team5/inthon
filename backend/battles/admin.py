from django.contrib import admin
from .models import BattleStatus, BattleRoom


@admin.register(BattleStatus)
class BattleStatusAdmin(admin.ModelAdmin):
    """대결상태 Admin 설정"""
    list_display = ('id', 'name',)
    search_fields = ('name',)


@admin.register(BattleRoom)
class BattleRoomAdmin(admin.ModelAdmin):
    """대결방 Admin 설정"""
    list_display = ('id', 'title', 'is_cote', 'host', 'status', 'is_private',)
    list_filter = ('is_cote', 'status', 'is_private',)
    search_fields = ('title', 'host__email',)
    fieldsets = (
        ('기본 정보', {
            'fields': ('title', 'is_cote', 'host', 'status')
        }),
        ('비공개 설정', {
            'fields': ('is_private', 'private_password')
        }),
        ('문제', {
            'fields': ('problems',)
        }),
    )
    filter_horizontal = ('problems',)



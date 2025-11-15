from django.urls import path
from .views import (
    BattleStatusListView,
    BattleRoomListCreateView,
    BattleRoomRetrieveDestroyView,
    verify_password,
    join_room,
    BattleRoomStatusUpdateView,
    submit_battle_result,
    get_battle_result,
)

urlpatterns = [
    # ---------- Reference Data ----------
    # GET /api/battles/statuses/ - 대결상태 목록
    path('statuses/', BattleStatusListView.as_view(), name='battle-status-list'),
    
    # ---------- BattleRoom ----------
    # GET /api/battles/rooms/ - 대결방 목록 조회 ('대기' 상태만)
    # POST /api/battles/rooms/ - 대결방 생성
    path('rooms/', BattleRoomListCreateView.as_view(), name='battle-room-list-create'),
    # GET /api/battles/rooms/{id}/ - 대결방 상세 조회
    # DELETE /api/battles/rooms/{id}/ - 대결방 삭제
    path('rooms/<int:id>/', BattleRoomRetrieveDestroyView.as_view(), name='battle-room-retrieve-destroy'),
    # POST /api/battles/rooms/{id}/verify-password/ - 비공개 방 비밀번호 확인
    path('rooms/<int:room_id>/verify-password/', verify_password, name='verify-password'),
    # POST /api/battles/rooms/{id}/join/ - 대결방 입장
    path('rooms/<int:room_id>/join/', join_room, name='join-room'),
    # PATCH /api/battles/rooms/{id}/status/ - 대결방 상태 변경
    path('rooms/<int:id>/status/', BattleRoomStatusUpdateView.as_view(), name='battle-room-status-update'),
    # POST /api/battles/rooms/{room_id}/submit-result/ - 대결 결과 제출
    path('rooms/<int:room_id>/submit-result/', submit_battle_result, name='submit-battle-result'),
    # GET /api/battles/rooms/{room_id}/result/ - 대결 결과 조회
    path('rooms/<int:room_id>/result/', get_battle_result, name='get-battle-result'),
]


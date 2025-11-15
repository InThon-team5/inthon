from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from urllib.parse import unquote

from .models import BattleStatus, BattleRoom
from .serializers import (
    BattleStatusSerializer,
    BattleRoomListSerializer,
    BattleRoomDetailSerializer,
    BattleRoomCreateSerializer,
    BattleRoomStatusUpdateSerializer,
    PasswordVerifySerializer,
)


# ---------- Reference Data Views ----------

class BattleStatusListView(generics.ListAPIView):
    """대결상태 목록 조회"""
    permission_classes = [AllowAny]
    serializer_class = BattleStatusSerializer
    queryset = BattleStatus.objects.all()


# ---------- BattleRoom Views ----------

class BattleRoomListCreateView(generics.ListCreateAPIView):
    """대결방 목록 조회 및 생성"""
    serializer_class = BattleRoomListSerializer
    
    def get_permissions(self):
        """GET은 인증 불필요, POST는 인증 필요"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        """요청 메서드에 따라 다른 Serializer 사용"""
        if self.request.method == 'POST':
            return BattleRoomCreateSerializer
        return BattleRoomListSerializer
    
    def get_queryset(self):
        """'대기' 상태인 대결방만 조회"""
        queryset = BattleRoom.objects.select_related(
            'host', 'status'
        ).prefetch_related('problems').filter(
            status__name='대기'
        )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """대결방 생성 전 검증: 이미 활성 대결방이 있는지 확인"""
        user = request.user
        
        # 현재 사용자가 호스트인 대결방 조회
        existing_rooms = BattleRoom.objects.filter(host=user).select_related('status')
        
        # 종료 상태가 아닌 대결방이 있는지 확인
        # 상태는 '대기', '진행', '종료' 3개만 존재
        active_rooms = existing_rooms.exclude(
            status__name='종료'
        )
        
        if active_rooms.exists():
            return Response(
                {
                    'error': '이미 활성화된 대결방이 있습니다. 대결방을 삭제하거나 종료 상태로 변경한 후 새로 생성할 수 있습니다.',
                    'existing_room_id': active_rooms.first().id
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """호스트를 현재 로그인한 사용자로 설정하고 상태를 '대기'로 고정"""
        # '대기' 상태 찾기
        waiting_status = BattleStatus.objects.filter(name='대기').first()
        if not waiting_status:
            raise ValidationError({
                'error': "'대기' 상태가 데이터베이스에 존재하지 않습니다."
            })
        serializer.save(host=self.request.user, status=waiting_status)


class BattleRoomRetrieveDestroyView(generics.RetrieveDestroyAPIView):
    """대결방 상세 조회 및 삭제"""
    serializer_class = BattleRoomDetailSerializer
    queryset = BattleRoom.objects.select_related(
        'host', 'status'
    ).prefetch_related('problems').all()
    lookup_field = 'id'
    
    def get_permissions(self):
        """GET은 인증 불필요, DELETE는 인증 필요"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """DELETE는 호스트만 자신의 방을 삭제할 수 있음"""
        if self.request.method == 'DELETE':
            return BattleRoom.objects.filter(host=self.request.user)
        return BattleRoom.objects.select_related(
            'host', 'status'
        ).prefetch_related('problems').all()
    
    def destroy(self, request, *args, **kwargs):
        """호스트만 자신의 방을 삭제할 수 있음"""
        room = self.get_object()
        if room.host != request.user:
            return Response(
                {'error': '호스트만 방을 삭제할 수 있습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password(request, room_id):
    """비공개 방 비밀번호 확인"""
    room = get_object_or_404(BattleRoom, id=room_id)
    
    if not room.is_private:
        return Response(
            {'error': '이 방은 공개 방입니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = PasswordVerifySerializer(data=request.data)
    if serializer.is_valid():
        password = serializer.validated_data['password']
        if room.private_password == password:
            return Response({'success': True}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request, room_id):
    """대결방 입장 (게스트 입장)"""
    room = get_object_or_404(BattleRoom, id=room_id)
    user = request.user
    
    # 호스트는 입장할 수 없음
    if room.host == user:
        return Response(
            {'error': '호스트는 입장할 수 없습니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 비공개 방인 경우 비밀번호 확인
    if room.is_private:
        password = request.data.get('password')
        if not password:
            return Response(
                {'error': '비밀번호가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if room.private_password != password:
            return Response(
                {'success': False},
                status=status.HTTP_200_OK
            )
    
    # 입장 성공
    return Response(
        {'success': True, 'message': '대결방에 입장했습니다.'},
        status=status.HTTP_200_OK
    )


class BattleRoomStatusUpdateView(generics.UpdateAPIView):
    """대결방 상태 변경"""
    permission_classes = [IsAuthenticated]
    serializer_class = BattleRoomStatusUpdateSerializer
    queryset = BattleRoom.objects.all()
    lookup_field = 'id'
    
    def get_queryset(self):
        """호스트만 자신의 방 상태를 변경할 수 있음"""
        return BattleRoom.objects.filter(host=self.request.user)
    
    def update(self, request, *args, **kwargs):
        room = self.get_object()
        if room.host != request.user:
            return Response(
                {'error': '호스트만 상태를 변경할 수 있습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class BattleRoomDeleteView(generics.DestroyAPIView):
    """대결방 삭제/종료"""
    permission_classes = [IsAuthenticated]
    queryset = BattleRoom.objects.all()
    lookup_field = 'id'
    
    def get_queryset(self):
        """호스트만 자신의 방을 삭제할 수 있음"""
        return BattleRoom.objects.filter(host=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        room = self.get_object()
        if room.host != request.user:
            return Response(
                {'error': '호스트만 방을 삭제할 수 있습니다.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)



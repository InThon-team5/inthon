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
    BattleResultSubmitSerializer,
    BattleResultSerializer,
)
from .models import BattleResult


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
    """대결방 입장 (호스트 또는 게스트 입장)"""
    room = get_object_or_404(BattleRoom, id=room_id)
    user = request.user
    
    # 호스트가 자신이 만든 방에 입장하는 경우 허용
    if room.host == user:
        # 호스트는 이미 방을 소유하고 있으므로 그냥 입장 성공
        return Response(
            {'success': True, 'message': '대결방에 입장했습니다.'},
            status=status.HTTP_200_OK
        )
    
    # 다른 사람이 파놓은 방에 입장하는 경우 (게스트 입장)
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
    
    # 이미 게스트가 있는지 확인
    if room.guest and room.guest != user:
        return Response(
            {'error': '이 방은 이미 가득 찼습니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not room.guest:
        room.guest = user

        playing_status = BattleStatus.objects.filter(name='진행').first()
        if playing_status:
            room.status = playing_status

        room.save()

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_battle_result(request, room_id):
    """대결 결과 제출 및 승패 판단"""
    room = get_object_or_404(BattleRoom, id=room_id)
    user = request.user
    
    # 참가자 확인 (host 또는 guest만 제출 가능)
    if room.host != user and room.guest != user:
        return Response(
            {'error': '이 대결방의 참가자가 아닙니다.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 이미 제출했는지 확인
    existing_result = BattleResult.objects.filter(room=room, user=user).first()
    if existing_result:
        return Response(
            {'error': '이미 결과를 제출했습니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 결과 데이터 검증
    serializer = BattleResultSubmitSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    remaining_time_percent = serializer.validated_data['remaining_time_percent']
    accuracy_percent = serializer.validated_data['accuracy_percent']
    total_score = remaining_time_percent + accuracy_percent
    
    # 결과 저장
    battle_result = BattleResult.objects.create(
        room=room,
        user=user,
        remaining_time_percent=remaining_time_percent,
        accuracy_percent=accuracy_percent,
        total_score=total_score
    )
    
    # 상대방 확인
    opponent = room.guest if user == room.host else room.host
    
    # 상대방이 없는 경우 (1대1 대결이므로 이 경우는 없어야 하지만 안전장치)
    if not opponent:
        battle_result.result = 'win'  # 상대방이 없으면 승리
        battle_result.save()
        return Response({
            'message': '결과가 제출되었습니다. (상대방 없음)',
            'my_result': BattleResultSerializer(battle_result).data,
            'is_complete': True
        }, status=status.HTTP_200_OK)
    
    opponent_result = BattleResult.objects.filter(room=room, user=opponent).first()
    
    # 승패 판단
    if opponent_result:
        # 둘 다 제출한 경우
        opponent_score = opponent_result.total_score
        
        if total_score > opponent_score:
            # 현재 사용자 승리
            battle_result.result = 'win'
            opponent_result.result = 'lose'
        elif total_score < opponent_score:
            # 현재 사용자 패배
            battle_result.result = 'lose'
            opponent_result.result = 'win'
        else:
            # 동점 (무승부)
            battle_result.result = 'draw'
            opponent_result.result = 'draw'
        
        battle_result.save()
        opponent_result.save()
        
        # 결과 반환 (둘 다 제출 완료)
        return Response({
            'message': '결과가 제출되었고 승패가 결정되었습니다.',
            'my_result': BattleResultSerializer(battle_result).data,
            'opponent_result': BattleResultSerializer(opponent_result).data,
            'is_complete': True,
            'my_result_status': battle_result.result,
            'opponent_result_status': opponent_result.result
        }, status=status.HTTP_200_OK)
    else:
        # 상대방이 아직 제출하지 않은 경우
        # 한 사람만 제출한 경우: 제출한 사람이 승리
        # (시간 제한이 다 되면 클라이언트에서 자동으로 0을 보내므로 결국 둘 다 제출하게 됨)
        # 하지만 네트워크 오류 등으로 한 사람만 제출한 경우를 대비
        battle_result.result = 'win'  # 제출한 사람이 승리
        battle_result.save()
        
        return Response({
            'message': '결과가 제출되었습니다. 상대방의 결과를 기다리는 중입니다. (현재 승리 상태)',
            'my_result': BattleResultSerializer(battle_result).data,
            'is_complete': False
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_battle_result(request, room_id):
    """대결 결과 조회"""
    room = get_object_or_404(BattleRoom, id=room_id)
    user = request.user
    
    # 참가자 확인
    if room.host != user and room.guest != user:
        return Response(
            {'error': '이 대결방의 참가자가 아닙니다.'},
            status=status.HTTP_403_FORBIDDEN
    )
    
    # 내 결과 조회
    my_result = BattleResult.objects.filter(room=room, user=user).first()
    
    # 상대방 결과 조회
    opponent = room.guest if user == room.host else room.host
    opponent_result = None
    if opponent:
        opponent_result = BattleResult.objects.filter(room=room, user=opponent).first()
    
    # 승패 판단 로직 (한 사람만 제출한 경우)
    if my_result and not opponent_result:
        # 내가 제출했지만 상대방은 제출하지 않음 -> 내가 승리
        my_result.result = 'win'
        my_result.save()
    elif not my_result and opponent_result:
        # 상대방은 제출했지만 나는 제출하지 않음 -> 상대방이 승리
        opponent_result.result = 'win'
        opponent_result.save()
    elif not my_result and not opponent_result:
        # 둘 다 제출하지 않음 -> 무승부 (결과는 없지만 클라이언트에게 알림)
        return Response({
            'message': '아직 결과가 제출되지 않았습니다.',
            'my_result': None,
            'opponent_result': None,
            'is_complete': False,
            'result': 'draw'  # 둘 다 제출하지 못한 경우 무승부
        }, status=status.HTTP_200_OK)
    
    response_data = {
        'my_result': BattleResultSerializer(my_result).data if my_result else None,
        'opponent_result': BattleResultSerializer(opponent_result).data if opponent_result else None,
        'is_complete': my_result is not None and opponent_result is not None
    }
    
    # 둘 다 제출한 경우 최종 승패 결과 포함
    if my_result and opponent_result:
        response_data['my_result_status'] = my_result.result
        response_data['opponent_result_status'] = opponent_result.result
    
    return Response(response_data, status=status.HTTP_200_OK)



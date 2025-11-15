from django.db import models
from users.models import User
from problems.models import Problem


class BattleStatus(models.Model):
    """대결상태 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '대결상태'
    
    def __str__(self):
        return self.name


class BattleRoom(models.Model):
    """대결방 모델"""
    title = models.CharField(max_length=200, null=True, blank=True)
    # is_cote: True면 코테, False면 미니
    is_cote = models.BooleanField(default=False)
    host = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='hosted_battles',
        db_column='host_id'
    )
    guest = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='guest_battles',
        db_column='guest_id',
        null=True,
        blank=True
    )
    status = models.ForeignKey(
        BattleStatus,
        on_delete=models.CASCADE,
        related_name='battles',
        db_column='status_id'
    )
    is_private = models.BooleanField(default=False)
    private_password = models.CharField(max_length=4, null=True, blank=True)
    
    # 대결방과 문제의 Many-to-Many 관계
    problems = models.ManyToManyField(
        Problem,
        related_name='battle_rooms',
        blank=True
    )
    
    class Meta:
        db_table = '대결방'
    
    def __str__(self):
        return f"{self.title} (호스트: {self.host})"


class BattleResult(models.Model):
    """대결 결과 모델"""
    room = models.ForeignKey(
        BattleRoom,
        on_delete=models.CASCADE,
        related_name='results',
        db_column='room_id'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='battle_results',
        db_column='user_id'
    )
    remaining_time_percent = models.IntegerField(
        help_text="남은 시간 퍼센트 (0-100)"
    )
    accuracy_percent = models.IntegerField(
        help_text="정답률 퍼센트 (0-100)"
    )
    total_score = models.IntegerField(
        help_text="합산 점수 (remaining_time_percent + accuracy_percent)"
    )
    result = models.CharField(
        max_length=10,
        choices=[
            ('win', '승리'),
            ('lose', '패배'),
            ('draw', '무승부')
        ],
        null=True,
        blank=True,
        help_text="승패 결과"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = '대결결과'
        unique_together = [['room', 'user']]  # 한 방에서 한 사용자는 하나의 결과만
    
    def __str__(self):
        return f"{self.room} - {self.user}: {self.result}"



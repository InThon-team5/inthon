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



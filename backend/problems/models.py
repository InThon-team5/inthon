from django.db import models


class Type(models.Model):
    """종류 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '종류'
    
    def __str__(self):
        return self.name


class Subject(models.Model):
    """과목 모델"""
    name = models.CharField(max_length=100)
    
    class Meta:
        db_table = '과목'
    
    def __str__(self):
        return self.name


class Problem(models.Model):
    """문제 모델"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    type = models.ForeignKey(
        Type,
        on_delete=models.CASCADE,
        related_name='problems'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='problems'
    )
    correct_answer = models.CharField(max_length=500)
    
    class Meta:
        db_table = '문제'
    
    def __str__(self):
        return self.title

from django.db import models
from django.contrib.auth import get_user_model
from juntas.models import Junta
User = get_user_model()

class ReasonType(models.TextChoices):
    TARDANZA = 'TARDANZA', 'Tardanza'
    INASISTENCIA = 'INASISTENCIA', 'Inasistencia'
    OTROS = 'OTROS','Otros'
class StatusType(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    CANCELADO = 'CANCELADO', 'Cancelado' 

class Multa(models.Model):
    junta = models.ForeignKey(Junta, on_delete=models.CASCADE, related_name='multas', null=True, default=None)
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='multas')
    reason = models.CharField(max_length=255, choices=ReasonType.choices, default=ReasonType.OTROS)
    comment = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pendiente', choices=StatusType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Multa for {self.member.username}: {self.amount}"
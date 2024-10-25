from django.db import models
from django.contrib.auth import get_user_model
from juntas.models import Junta

User = get_user_model()

class AccionPurchase(models.Model):
    junta = models.ForeignKey(Junta, on_delete=models.CASCADE, related_name='accion_purchases', null=False)
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accion_purchases')
    date = models.DateTimeField()
    quantity = models.IntegerField()
    value = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Accion Purchase by {self.member.username}: {self.quantity} at {self.value}"
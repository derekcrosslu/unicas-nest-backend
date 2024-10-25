from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class Junta(models.Model):
    name = models.CharField(max_length=255)
    total_shares = models.IntegerField(default=0)
    share_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration_months = models.IntegerField(default=12)
    fecha_inicio = models.DateField()
    periodo = models.IntegerField(default=1)
    current_month = models.IntegerField(default=1)
    members = models.ManyToManyField(User, related_name='juntas', blank=True)
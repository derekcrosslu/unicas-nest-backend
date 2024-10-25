from django.db import models
from juntas.models import Junta
# Create your models here.
class AgendaItem(models.Model):
    junta = models.ForeignKey(Junta, related_name='agenda_items', on_delete=models.CASCADE)
    content = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.junta.name} - {self.content}"

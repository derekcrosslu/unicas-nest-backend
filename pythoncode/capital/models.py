from typing import Iterable
from django.db import models
from juntas.models import Junta

class CapitalSocial(models.Model):
    junta = models.OneToOneField(Junta, on_delete=models.CASCADE)
    reserva_legal = models.FloatField(default=0.0)
    fondo_social = models.FloatField(default=0.0)

class IngresoCapital(models.Model):
    capital_social = models.ForeignKey(CapitalSocial, on_delete=models.CASCADE, unique=False)
    type = models.CharField(max_length=255, choices=[('Reserva Legal', 'Reserva Legal'), ('Fondo Social', 'Fondo Social')])
    amount = models.FloatField()
    date = models.DateField(auto_now_add=True)
    def save(self, *args, **kwargs):
        super(IngresoCapital, self).save(*args, **kwargs)
        if self.type == 'Reserva Legal':
            self.capital_social.reserva_legal += self.amount
            self.capital_social.save()
        elif self.type == 'Fondo Social':
            self.capital_social.fondo_social += self.amount
            self.capital_social.save()

class GastoCapital(models.Model):
    capital_social = models.ForeignKey(CapitalSocial, on_delete=models.CASCADE, unique=False)
    type = models.CharField(max_length=255, choices=[('Reserva Legal', 'Reserva Legal'), ('Fondo Social', 'Fondo Social')])
    amount = models.FloatField()
    description = models.TextField()
    date = models.DateField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super(GastoCapital, self).save(*args, **kwargs)
        if self.type == 'Reserva Legal':
            self.capital_social.reserva_legal -= self.amount
            self.capital_social.save()
        elif self.type == 'Fondo Social':
            self.capital_social.fondo_social -= self.amount
            self.capital_social.save()
    
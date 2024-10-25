from django.db import models
from users.models import CustomUser
from juntas.models import Junta
from decimal import Decimal
class PrestamoStatus(models.TextChoices):
    PENDING = 'Pending'
    APPROVED = 'Approved'
    REJECTED = 'Rejected'

class PrestamoType(models.TextChoices):
    CUOTA_REBATIR = 'Cuota a rebatir'
    CUOTA_FIJA = 'Cuota fija'
    CUOTA_VENCIMIENTO = 'Cuota a vencimiento'
    CUOTA_VARIABLE = 'Cuota variable'

class Prestamo(models.Model):
    member = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='loans')
    junta = models.ForeignKey(Junta, on_delete=models.CASCADE, related_name='loans')
    request_date = models.DateField()
    fecha_vencimiento = models.DateField(auto_now=True)
    fecha_pago = models.DateField(auto_now=True)
    amount = models.FloatField()
    monthly_interest = models.FloatField()
    number_of_installments = models.IntegerField()
    status = models.CharField(max_length=20, choices=PrestamoStatus.choices, default=PrestamoStatus.PENDING)
    rejection_reason = models.TextField(blank=True)
    paid = models.BooleanField(default=False)
    remaining_amount = models.FloatField(null=True)
    remaining_installments = models.IntegerField(null=True)
    loan_type = models.CharField(max_length=20, choices=PrestamoType.choices, default=PrestamoType.CUOTA_FIJA)
    monthly_payment = models.FloatField(null=True)

    def __str__(self):
        return f"Préstamo #{self.id} - {self.member.get_full_name()} - {self.amount} - {self.loan_type}"

    
    # def save(self, *args, **kwargs):
    #     self.monthly_interest /= 100
    #     try:
    #         if not self.id:
    #             self.remaining_amount = self.amount
    #             self.remaining_installments = self.number_of_installments
                
    #             if self.loan_type == PrestamoType.CUOTA_FIJA:
    #                 self.monthly_payment = self.amount / self.number_of_installments + (self.amount * self.monthly_interest)
                
    #             elif self.loan_type == PrestamoType.CUOTA_VENCIMIENTO:
    #                 self.monthly_payment = 0
                
    #             elif self.loan_type == PrestamoType.CUOTA_REBATIR:
    #                 self.monthly_payment = self.amount / self.number_of_installments + (self.amount * self.monthly_interest)

    #             elif self.loan_type == PrestamoType.CUOTA_VARIABLE:
    #                 self.monthly_payment = None  # Variable payments
                
    #             super().save(*args, **kwargs)
        
    #     except Exception as e:
    #         print(e)
            
class PagosPrestamos(models.Model):
    # member = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='members', null=False, blank=False, default=1)
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE, related_name='payments')
    fecha_pago = models.DateField()
    custom_amount = models.FloatField(null=True, blank=True)
    
    def __str__(self):
        return f"Pago para Préstamo #{self.prestamo.id} - {self.fecha_pago}"
    
    # def save(self, *args, **kwargs):
    #     if not self.id:
    #         prestamo = Prestamo.objects.get(id=self.prestamo.id)
    #         prestamo.remaining_amount = 0
    #         prestamo.amount = 0
            # payment_amount = self.custom_amount or prestamo.monthly_payment

            # if prestamo.loan_type == PrestamoType.CUOTA_REBATIR:
            #     prestamo.remaining_amount -= payment_amount
            #     prestamo.monthly_payment = (prestamo.monthly_interest * prestamo.remaining_amount) + (prestamo.amount / prestamo.number_of_installments)
            # elif prestamo.loan_type in [PrestamoType.CUOTA_FIJA, PrestamoType.CUOTA_VENCIMIENTO]:
            #     prestamo.remaining_amount -= payment_amount
            # elif prestamo.loan_type == PrestamoType.CUOTA_VARIABLE:
            #     if self.custom_amount is None:
            #         raise ValueError("Custom amount is required for variable payment loans")
            #     prestamo.remaining_amount -= self.custom_amount

            # prestamo.remaining_installments -= 1
            # if prestamo.remaining_installments <= 0 or prestamo.remaining_amount <= 0:
            #     prestamo.paid = True

        #     prestamo.save()

        # super().save(*args, **kwargs)
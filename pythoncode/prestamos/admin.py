from django.contrib import admin
from .models import Prestamo, PagosPrestamos

class PrestamoAdmin(admin.ModelAdmin):
    exclude = ('remaining_amount', 'remaining_installments', 'monthly_payment')

admin.site.register(Prestamo, PrestamoAdmin)

class PagosPrestamosAdmin(admin.ModelAdmin):
    list_display = ('fecha_pago', 'custom_amount',  'prestamo')

admin.site.register(PagosPrestamos, PagosPrestamosAdmin)
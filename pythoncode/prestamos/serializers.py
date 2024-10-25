from rest_framework import serializers
from .models import Prestamo, PagosPrestamos

class PrestamoSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    class Meta:
        model = Prestamo
        fields = '__all__'  # or specify fields like ['id', 'member', 'junta', ...]



class PagosPrestamosSerializer(serializers.ModelSerializer):
    prestamo_amount = serializers.FloatField(source='prestamo.amount', read_only=True)
    prestamo_loan_type = serializers.CharField(source='prestamo.loan_type', read_only=True)
    prestamo_remaining_amount = serializers.FloatField(source='prestamo.remaining_amount', read_only=True)
    prestamo_remaining_installments = serializers.IntegerField(source='prestamo.remaining_installments', read_only=True)
    prestamo_monthly_payment = serializers.FloatField(source='prestamo.monthly_payment', read_only=True)
    prestamo_monthly_interest = serializers.FloatField(source='prestamo.monthly_interest', read_only=True)
    prestamo_id = serializers.PrimaryKeyRelatedField(source='prestamo.id', read_only=True)
    
    class Meta:
        model = PagosPrestamos
        fields = '__all__'
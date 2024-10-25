from .models import CapitalSocial, IngresoCapital, GastoCapital
from rest_framework import serializers

class CapitalSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapitalSocial
        fields = ['reserva_legal', 'fondo_social', 'id']
        
class IngresoCapitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngresoCapital
        fields = '__all__'

class GastoCapitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = GastoCapital
        fields = '__all__'


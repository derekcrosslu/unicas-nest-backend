from rest_framework import serializers
from .models import AccionPurchase

class AccionPurchaseSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    class Meta:
        model = AccionPurchase
        fields = '__all__'
        # fields = ['id', 'member', 'date', 'quantity', 'value', 'junta', 'member_name']
        # read_only_fields = ['id', 'date', 'junta', 'member_name']
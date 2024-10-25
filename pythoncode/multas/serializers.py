from rest_framework import serializers
from .models import Multa

class MultaSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    junta_name = serializers.CharField(source='junta.name', read_only=True)
    class Meta:
        model = Multa
        fields = ['id', 'member', 'member_name', 'reason', 'amount', 'status', 'created_at', 'junta', 'junta_name', 'comment']
        read_only_fields = ['id', 'created_at']
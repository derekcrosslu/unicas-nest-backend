from rest_framework import serializers
from .models import Junta, AgendaItem

class AgendaItemSerializer(serializers.ModelSerializer):
    junta_name = serializers.ReadOnlyField(source='junta.name')

    class Meta:
        model = AgendaItem
        fields = ['id', 'junta', 'junta_name', 'content', 'created_at', 'updated_at']

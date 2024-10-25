from rest_framework import serializers
from .models import Junta
from django.contrib.auth import get_user_model

User = get_user_model()

class JuntaSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)

    class Meta:
        model = Junta
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['share_value'] = float(representation['share_value'])
        return representation

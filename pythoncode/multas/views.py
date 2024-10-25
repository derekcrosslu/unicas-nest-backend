from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Multa
from .serializers import MultaSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

class MultaViewSet(viewsets.ModelViewSet):
    queryset = Multa.objects.all()
    serializer_class = MultaSerializer
    permission_classes = [IsAuthenticated]
    
@api_view(['GET'])
def multas_by_junta(request, junta_id):
    multas = Multa.objects.filter(junta_id=junta_id)
    serializer = MultaSerializer(multas, many=True)
    return Response(serializer.data)

from rest_framework import viewsets
from .models import  AgendaItem
from .serializers import AgendaItemSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

class AgendaItemViewSet(viewsets.ModelViewSet):
    queryset = AgendaItem.objects.all()
    serializer_class = AgendaItemSerializer

    def get_queryset(self):
        junta_id = self.request.query_params.get('junta_id')
        if junta_id:
            return AgendaItem.objects.filter(junta_id=junta_id)
        return AgendaItem.objects.all()

@api_view(['GET'])
def get_agenda_by_junta(request, junta_id):
    agenda_items = AgendaItem.objects.filter(junta_id=junta_id)
    serializer = AgendaItemSerializer(agenda_items, many=True)
    return Response(serializer.data)
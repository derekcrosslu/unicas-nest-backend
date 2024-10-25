from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from rest_framework.response import Response
from .models import AccionPurchase
from .serializers import AccionPurchaseSerializer
from users.models import CustomUser 
from juntas.models import Junta
from rest_framework.decorators import api_view

class AccionPurchaseList(generics.ListCreateAPIView):
    queryset = AccionPurchase.objects.all()
    serializer_class = AccionPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        memberId = self.request.data['member']
        juntaId = self.request.data['junta']
        member = CustomUser.objects.get(id=memberId)
        junta  = Junta.objects.get(id=juntaId)
        serializer.save(member=member, junta=junta)

class AccionPurchaseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = AccionPurchase.objects.all()
    serializer_class = AccionPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserAccionPurchases(generics.ListAPIView):
    serializer_class = AccionPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AccionPurchase.objects.filter(member=self.request.user)  # Changed 'self.request.member' to 'self.request.user'

class AccionPurchaseDelete(generics.DestroyAPIView):
    queryset = AccionPurchase.objects.all()
    serializer_class = AccionPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=204)  # Return no content on successful deletion

@api_view(['GET'])
def get_acciones_by_junta(request, junta_id):
    queryset = AccionPurchase.objects.filter(junta_id=junta_id)
    serializer = AccionPurchaseSerializer(queryset, many=True)
    return Response(serializer.data)

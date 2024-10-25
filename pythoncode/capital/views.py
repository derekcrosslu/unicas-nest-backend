from django.shortcuts import render

from rest_framework import generics
from .models import CapitalSocial, IngresoCapital, GastoCapital
from .serializers import CapitalSocialSerializer, IngresoCapitalSerializer, GastoCapitalSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
class CapitalSocialList(generics.ListCreateAPIView):
    queryset = CapitalSocial.objects.all()
    serializer_class = CapitalSocialSerializer

class CapitalSocialDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CapitalSocial.objects.all()
    serializer_class = CapitalSocialSerializer

"""
Ingreso y Gasto
"""
class IngresoCapitalList(generics.ListCreateAPIView):
    queryset = IngresoCapital.objects.all()
    serializer_class = IngresoCapitalSerializer

class IngresoCapitalDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = IngresoCapital.objects.all()
    serializer_class = IngresoCapitalSerializer

class GastoCapitalList(generics.ListCreateAPIView):
    queryset = GastoCapital.objects.all()
    serializer_class = GastoCapitalSerializer

class GastoCapitalDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = GastoCapital.objects.all()
    serializer_class = GastoCapitalSerializer

@api_view(['GET'])
def get_capitalsocial_by_junta(request, junta_id):
    try:
        capital_social, created = CapitalSocial.objects.get_or_create(junta_id=junta_id)
        serializer = CapitalSocialSerializer(capital_social)
        return Response(serializer.data)  # Return the serialized data
    except CapitalSocial.DoesNotExist:
        return Response({'message': 'Capital social not found'}, status=404)
    except Exception as e:
        return Response({'message': str(e)}, status=500)



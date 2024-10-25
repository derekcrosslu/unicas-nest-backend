from django.shortcuts import render
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from .models import Prestamo, PagosPrestamos
from .serializers import PrestamoSerializer, PagosPrestamosSerializer
from rest_framework.decorators import api_view
from .models import PrestamoType
from rest_framework import status

class PrestamoList(generics.ListCreateAPIView):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        prestamo = serializer.save()
        prestamo.monthly_interest /= 100
        prestamo.remaining_amount = prestamo.amount
        prestamo.remaining_installments = prestamo.number_of_installments
        
        if prestamo.loan_type == PrestamoType.CUOTA_FIJA:
            prestamo.monthly_payment = (prestamo.amount / prestamo.number_of_installments) + (prestamo.amount * prestamo.monthly_interest)
        elif prestamo.loan_type == PrestamoType.CUOTA_VENCIMIENTO:
            prestamo.monthly_payment = prestamo.amount * prestamo.monthly_interest
        elif prestamo.loan_type == PrestamoType.CUOTA_REBATIR:
            prestamo.monthly_payment = (prestamo.amount / prestamo.number_of_installments) + (prestamo.remaining_amount * prestamo.monthly_interest)
        elif prestamo.loan_type == PrestamoType.CUOTA_VARIABLE:
            prestamo.monthly_payment = None  # Variable payments
        
        prestamo.save()
class PrestamoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserPrestamos(generics.ListAPIView):
    serializer_class = PrestamoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Prestamo.objects.filter(user=self.request.user)  # Assuming a user field exists

class PrestamoDelete(generics.DestroyAPIView):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        remaining_prestamos = Prestamo.objects.all()
        serializer = self.get_serializer(remaining_prestamos, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def get_prestamos_by_junta(request, junta_id):
    prestamos = Prestamo.objects.filter(junta_id=junta_id)
    serializer = PrestamoSerializer(prestamos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_pagoprestamos_by_junta(request, junta_id):
    prestamos = Prestamo.objects.filter(junta_id=junta_id)
    pagos = PagosPrestamos.objects.filter(prestamo__in=prestamos)
    serializer = PagosPrestamosSerializer(pagos, many=True)
    return Response(serializer.data)


"""

"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import PagosPrestamos, Prestamo, PrestamoType
from .serializers import PagosPrestamosSerializer

from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import PagosPrestamos, Prestamo, PrestamoType
from .serializers import PagosPrestamosSerializer

class PagosPrestamosViewSet(viewsets.ModelViewSet):
    queryset = PagosPrestamos.objects.all()
    serializer_class = PagosPrestamosSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            with transaction.atomic():
                instance = serializer.save()
                prestamo = instance.prestamo
                if prestamo.remaining_installments == 0:
                    raise ValueError("No remaining installments")
                if instance.custom_amount is None:
                    payment_amount = prestamo.monthly_payment
                else:
                    payment_amount = instance.custom_amount
                
                if prestamo.loan_type == PrestamoType.CUOTA_REBATIR:
                    prestamo.monthly_payment = (prestamo.monthly_interest * prestamo.remaining_amount) + (prestamo.amount / prestamo.number_of_installments)
                    prestamo.remaining_amount -= (prestamo.amount / prestamo.number_of_installments)
                    instance.custom_amount = prestamo.monthly_payment
                    instance.save()
                elif prestamo.loan_type == PrestamoType.CUOTA_FIJA:
                    prestamo.remaining_amount -= payment_amount

                elif prestamo.loan_type == PrestamoType.CUOTA_VARIABLE:
                    if instance.custom_amount is None:
                        raise ValueError("Custom amount is required for variable payment loans")

                    if prestamo.remaining_installments == 1:
                        prestamo.monthly_payment = prestamo.remaining_amount * prestamo.monthly_interest + prestamo.remaining_amount
                        prestamo.remaining_amount = 0
                        instance.custom_amount = prestamo.monthly_payment
                        instance.save()
                        # if instance.custom_amount != prestamo.remaining_amount + (prestamo.monthly_interest * prestamo.remaining_amount):
                        #     raise ValueError("Last payment must be the remaining amount plus interest")
                    else:
                        interest_payment = prestamo.monthly_interest * prestamo.remaining_amount
                        capital = instance.custom_amount - interest_payment
                        prestamo.monthly_payment = capital + interest_payment
                        prestamo.remaining_amount -= capital
                        instance.save()

                elif prestamo.loan_type == PrestamoType.CUOTA_VENCIMIENTO:
                    if prestamo.remaining_amount is None or prestamo.monthly_payment is None:
                        raise ValueError("Remaining amount or monthly payment is not set for this loan")
                    
                    if prestamo.remaining_installments == 1:
                        prestamo.monthly_payment = prestamo.amount * prestamo.monthly_interest + prestamo.amount
                        prestamo.remaining_amount = 0
                    else:
                        prestamo.monthly_payment = prestamo.amount * prestamo.monthly_interest
                    
                    instance.custom_amount = prestamo.monthly_payment
                    instance.save()

                if prestamo.remaining_installments > 0:
                    prestamo.remaining_installments -= 1

                prestamo.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
class PagosPrestamosDetail(generics.ListAPIView):
    serializer_class = PagosPrestamosSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PagosPrestamos.objects.all()

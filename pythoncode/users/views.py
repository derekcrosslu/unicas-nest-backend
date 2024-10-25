from django.shortcuts import render
# from rest_framework import permissions, viewsets

from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializer import UserSerializer
from juntas.models import Junta
from prestamos.models import Prestamo, PagosPrestamos
from prestamos.serializers import PrestamoSerializer, PagosPrestamosSerializer
from multas.serializers import MultaSerializer
from acciones.models import AccionPurchase
from acciones.serializers import AccionPurchaseSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@csrf_exempt
@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def test_endpoint(request):
    if request.method == 'OPTIONS':
        return JsonResponse({}, status=200)
    return JsonResponse({
        "status": "ok",
        "message": "Test endpoint working"
    })



CustomUser = get_user_model()

# class UserViewSet(viewsets.ModelViewSet):
#     """
#     API endpoint that allows users to be viewed or edited.
#     """
#     queryset = CustomUser.objects.all().order_by("-date_joined")
#     serializer_class = UserSerializer
#     permission_classes = [IsAdminUser]

#     def get_queryset(self):
#         queryset = super().get_queryset()
#         document_number = self.request.query_params.get('document_number', None)
#         if document_number:
#             queryset = queryset.filter(document_number=document_number)
#         return queryset


from rest_framework import permissions, viewsets, status  # Add status import

from django.db.models import Q

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Debug print
        
        # Check if user already exists
        document_number = request.data.get('document_number')
        existing_user = CustomUser.objects.filter(
            Q(document_number=document_number) |
            Q(username=request.data.get('username')) |
            Q(email=request.data.get('email'))
        ).first()
        
        if existing_user:
            # If user exists, return their data instead of an error
            serializer = self.get_serializer(existing_user)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
            
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug print
            return Response(
                {
                    'status': 'error',
                    'errors': serializer.errors,
                    'message': 'Validation failed'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        document_number = self.request.query_params.get('document_number', None)
        if document_number:
            queryset = queryset.filter(document_number=document_number)
        return queryset

@api_view(['GET'])
def get_users_from_junta(request, junta_id):
    try:
        junta = Junta.objects.get(id=junta_id)
        users = junta.members.all()
        serializer = UserSerializer(users, many=True)
        return Response({
            'junta_id': junta_id,
            'total_members': users.count(),
            'members': serializer.data
        })
    except Junta.DoesNotExist:
        return Response({"error": "Junta not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_user_info(request):
    try:
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_member_by_dni(request, dni):
    try:
        member = CustomUser.objects.get(document_number=dni)
        serializer = UserSerializer(member)
        return Response({
            'found': True,
            'member': serializer.data
        })
    except CustomUser.DoesNotExist:
        return Response({
            'found': False,
            'error': "Member not found"
        }, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_member_prestamos(request, dni):
    try:
        user = CustomUser.objects.get(document_number=dni)
        prestamos = Prestamo.objects.filter(member=user)
        serializer = PrestamoSerializer(prestamos, many=True)
        return Response({
            'document_number': dni,
            'total_prestamos': prestamos.count(),
            'prestamos': serializer.data
        })
    except CustomUser.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_member_pagos(request, dni):
    try:
        user = CustomUser.objects.get(document_number=dni)
        prestamos = Prestamo.objects.filter(member=user)
        pagos = PagosPrestamos.objects.filter(prestamo__in=prestamos)
        serializer = PagosPrestamosSerializer(pagos, many=True)
        return Response({
            'document_number': dni,
            'total_pagos': pagos.count(),
            'pagos': serializer.data
        })
    except CustomUser.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_member_multas(request, dni):
    try:
        member = CustomUser.objects.get(document_number=dni)
        multas = member.multas.all()
        serializer = MultaSerializer(multas, many=True)
        return Response({
            'document_number': dni,
            'total_multas': multas.count(),
            'multas': serializer.data
        })
    except CustomUser.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_member_acciones(request, dni):
    try:
        user = CustomUser.objects.get(document_number=dni)
        acciones = AccionPurchase.objects.filter(member=user)
        serializer = AccionPurchaseSerializer(acciones, many=True)
        return Response({
            'document_number': dni,
            'total_acciones': acciones.count(),
            'acciones': serializer.data
        })
    except CustomUser.DoesNotExist:
        return Response({"error": "Member not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    



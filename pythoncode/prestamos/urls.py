from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrestamoDelete, PrestamoList, PrestamoDetail, UserPrestamos, PagosPrestamosViewSet, get_prestamos_by_junta, get_pagoprestamos_by_junta
urlpatterns = [
    path('api/prestamos/', PrestamoList.as_view(), name='prestamo-list'),
    path('api/prestamos/<int:pk>/', PrestamoDetail.as_view(), name='prestamo-detail'),
    path('api/prestamos/junta/<int:junta_id>/',get_prestamos_by_junta, name='prestamos-junta'),
    path('api/prestamos/delete/<int:pk>/', PrestamoDelete.as_view(), name='prestamo-delete'),
    path('api/pagosprestamos/', PagosPrestamosViewSet.as_view({'get': 'list', 'post': 'create'}), name='pagosprestamos-list'),
    path('api/pagosprestamos/junta/<int:junta_id>',get_pagoprestamos_by_junta ,name='pagosprestamos-junta'),
    
    # path('api/pagosprestamos/<int:pk>/', PagosPrestamosViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='pagosprestamos-detail'),
]

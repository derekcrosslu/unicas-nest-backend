from django.urls import path
from .views import AccionPurchaseList, AccionPurchaseDetail, UserAccionPurchases, AccionPurchaseDelete, get_acciones_by_junta

urlpatterns = [
    path('api/acciones/', AccionPurchaseList.as_view(), name='accion-purchase-list'),
    path('api/acciones/<int:pk>/', AccionPurchaseDetail.as_view(), name='accion-purchase-detail'),
    path('api/user-acciones/', UserAccionPurchases.as_view(), name='user-accion-purchases'),
    path('api/acciones/<int:pk>/delete/', AccionPurchaseDelete.as_view(), name='accion-purchase-delete'),
    path('api/acciones/junta/<int:junta_id>/',get_acciones_by_junta, name='acciones-by-junta'),
]
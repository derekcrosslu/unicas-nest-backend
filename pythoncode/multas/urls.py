from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MultaViewSet, multas_by_junta

router = DefaultRouter()
router.register(r'multas', MultaViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/multas/junta/<int:junta_id>', multas_by_junta)
]
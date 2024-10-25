from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  AgendaItemViewSet, get_agenda_by_junta

router = DefaultRouter()

router.register(r'agenda', AgendaItemViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/agenda/junta/<int:junta_id>', get_agenda_by_junta)
]
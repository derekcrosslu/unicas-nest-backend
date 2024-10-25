from django.urls import path
from . import views

urlpatterns = [
    path('api/juntas/', views.JuntaList.as_view(), name='junta-list'),
    path('api/juntas/<int:pk>/', views.JuntaDetail.as_view(), name='junta-detail'),
    path('api/juntas/<int:pk>/', views.JuntaDelete.as_view(), name='junta-delete'),
    path('api/juntas/add', views.add_user_junta, name='add-user-junta')
]

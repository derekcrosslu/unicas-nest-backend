from .views import CapitalSocialList, CapitalSocialDetail, IngresoCapitalList, IngresoCapitalDetail, GastoCapitalList, GastoCapitalDetail, get_capitalsocial_by_junta
from django.urls import path

urlpatterns = [  # {{ edit_2 }}
    path('api/capital/social/<int:pk>/', CapitalSocialDetail.as_view(), name='capital-social-detail'),
    path('api/capital/social/', CapitalSocialList.as_view(), name='capital-social-list'),
    path('api/capital/social/junta/<int:junta_id>', get_capitalsocial_by_junta, name='capital-social-junta'),
    path('api/capital/ingreso/', IngresoCapitalList.as_view(), name='ingreso-capital-list'),  # {{ edit_1 }}
    path('api/capital/ingreso/<int:pk>/', IngresoCapitalDetail.as_view(), name='ingreso-capital-detail'),  # {{ edit_1 }}
    path('api/capital/gasto/', GastoCapitalList.as_view(), name='gasto-capital-list'),  # {{ edit_1 }}
    path('api/capital/gasto/<int:pk>/', GastoCapitalDetail.as_view(), name='gasto-capital-detail'),  # {{ edit_1 }}
]
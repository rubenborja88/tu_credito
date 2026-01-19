from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.banks.api.viewsets import BankViewSet
from apps.clients.api.viewsets import ClientViewSet
from apps.credits.api.viewsets import CreditViewSet

router = DefaultRouter()
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'credits', CreditViewSet, basename='credit')

urlpatterns = [
    # OpenAPI schema + Swagger UI
    path('schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[AllowAny]), name='redoc'),

    # Auth
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API
    path('', include(router.urls)),
]

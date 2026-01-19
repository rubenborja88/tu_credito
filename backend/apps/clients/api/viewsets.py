from rest_framework import viewsets

from apps.clients.models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('bank').all().order_by('id')
    serializer_class = ClientSerializer
    search_fields = ('full_name', 'email')
    filterset_fields = ('person_type', 'bank')
    ordering_fields = ('id', 'full_name')

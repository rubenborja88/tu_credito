from rest_framework import viewsets

from apps.banks.models import Bank
from .serializers import BankSerializer


class BankViewSet(viewsets.ModelViewSet):
    queryset = Bank.objects.all().order_by('id')
    serializer_class = BankSerializer
    search_fields = ('name',)
    filterset_fields = ('bank_type',)
    ordering_fields = ('id', 'name')

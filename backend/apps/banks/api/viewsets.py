from rest_framework import viewsets
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view

from apps.banks.models import Bank
from .serializers import BankSerializer
from .filters import BankFilter


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number.'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Number of results per page.'),
            OpenApiParameter(
                'ordering',
                OpenApiTypes.STR,
                description='Ordering field (prefix with "-" for descending). Supported: id, name.',
            ),
            OpenApiParameter(
                'name',
                OpenApiTypes.STR,
                description='Filter banks whose name contains this value.',
            ),
            OpenApiParameter(
                'address',
                OpenApiTypes.STR,
                description='Filter banks whose address contains this value.',
            ),
            OpenApiParameter(
                'bank_type',
                OpenApiTypes.STR,
                description='Comma-separated list of bank types (PRIVATE,GOVERNMENT).',
            ),
        ]
    )
)
class BankViewSet(viewsets.ModelViewSet):
    queryset = Bank.objects.all().order_by('id')
    serializer_class = BankSerializer
    search_fields = ('name',)
    filterset_class = BankFilter
    ordering_fields = ('id', 'name')

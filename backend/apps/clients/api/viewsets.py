from rest_framework import viewsets
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view

from apps.clients.models import Client
from .serializers import ClientSerializer
from .filters import ClientFilter


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number.'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Number of results per page.'),
            OpenApiParameter(
                'ordering',
                OpenApiTypes.STR,
                description='Ordering field (prefix with "-" for descending). Supported: id, full_name.',
            ),
            OpenApiParameter(
                'full_name',
                OpenApiTypes.STR,
                description='Filter clients whose full name contains this value.',
            ),
            OpenApiParameter(
                'email',
                OpenApiTypes.STR,
                description='Filter clients whose email contains this value.',
            ),
            OpenApiParameter(
                'bank_name',
                OpenApiTypes.STR,
                description='Filter clients whose bank name contains this value.',
            ),
            OpenApiParameter(
                'person_type',
                OpenApiTypes.STR,
                description='Comma-separated list of person types (NATURAL,LEGAL_ENTITY).',
            ),
            OpenApiParameter(
                'bank',
                OpenApiTypes.STR,
                description='Comma-separated list of bank IDs.',
            ),
        ]
    )
)
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('bank').all().order_by('id')
    serializer_class = ClientSerializer
    search_fields = ('full_name', 'email')
    filterset_class = ClientFilter
    ordering_fields = ('id', 'full_name')

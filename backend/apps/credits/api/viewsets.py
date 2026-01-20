from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema, extend_schema_view

from apps.credits.models import Credit
from .serializers import CreditSerializer
from .filters import CreditFilter


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number.'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Number of results per page.'),
            OpenApiParameter(
                'ordering',
                OpenApiTypes.STR,
                description=(
                    'Ordering field (prefix with "-" for descending). '
                    'Supported: id, created_at, min_payment, max_payment, term_months.'
                ),
            ),
            OpenApiParameter(
                'client_full_name',
                OpenApiTypes.STR,
                description='Filter credits whose client full name contains this value.',
            ),
            OpenApiParameter(
                'description',
                OpenApiTypes.STR,
                description='Filter credits whose description contains this value.',
            ),
            OpenApiParameter(
                'bank_name',
                OpenApiTypes.STR,
                description='Filter credits whose bank name contains this value.',
            ),
            OpenApiParameter(
                'credit_type',
                OpenApiTypes.STR,
                description='Comma-separated list of credit types (AUTO,MORTGAGE,COMMERCIAL).',
            ),
            OpenApiParameter(
                'bank',
                OpenApiTypes.STR,
                description='Comma-separated list of bank IDs.',
            ),
            OpenApiParameter(
                'min_payment',
                OpenApiTypes.STR,
                description='Filter credits whose min_payment contains this value.',
            ),
            OpenApiParameter(
                'max_payment',
                OpenApiTypes.STR,
                description='Filter credits whose max_payment contains this value.',
            ),
            OpenApiParameter(
                'term_months',
                OpenApiTypes.STR,
                description='Filter credits whose term months contains this value.',
            ),
        ]
    )
)
class CreditViewSet(viewsets.ModelViewSet):
    queryset = Credit.objects.select_related('client', 'bank').all().order_by('-created_at')
    serializer_class = CreditSerializer
    search_fields = ('description', 'client__full_name')
    filterset_class = CreditFilter
    ordering_fields = ('created_at', 'min_payment', 'max_payment', 'term_months', 'id')

    def perform_create(self, serializer):
        credit = serializer.save()
        # Requirement: send an email when a new credit is registered.
        # Default EMAIL_BACKEND is console; configure SMTP via env if desired.
        if credit.client.email:
            send_mail(
                subject='New credit registered',
                message=(
                    f"Hello {credit.client.full_name},\n\n"
                    f"A new credit has been registered for you.\n"
                    f"Description: {credit.description}\n"
                    f"Bank: {credit.bank.name}\n"
                    f"Type: {credit.credit_type}\n"
                    f"Term (months): {credit.term_months}\n"
                    f"Min payment: {credit.min_payment}\n"
                    f"Max payment: {credit.max_payment}\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[credit.client.email],
                fail_silently=True,
            )

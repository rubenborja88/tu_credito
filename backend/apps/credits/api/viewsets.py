from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets

from apps.credits.models import Credit
from .serializers import CreditSerializer


class CreditViewSet(viewsets.ModelViewSet):
    queryset = Credit.objects.select_related('client', 'bank').all().order_by('-created_at')
    serializer_class = CreditSerializer
    search_fields = ('description', 'client__full_name')
    filterset_fields = ('credit_type', 'bank')
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

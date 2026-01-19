from django.core.validators import MinValueValidator
from django.db import models

from apps.banks.models import Bank
from apps.clients.models import Client


class Credit(models.Model):
    class CreditType(models.TextChoices):
        AUTO = 'AUTO', 'Automotive'
        MORTGAGE = 'MORTGAGE', 'Mortgage'
        COMMERCIAL = 'COMMERCIAL', 'Commercial'

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='credits')
    description = models.CharField(max_length=255)
    min_payment = models.DecimalField(max_digits=12, decimal_places=2)
    max_payment = models.DecimalField(max_digits=12, decimal_places=2)
    term_months = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    bank = models.ForeignKey(Bank, on_delete=models.PROTECT, related_name='credits')
    credit_type = models.CharField(max_length=32, choices=CreditType.choices)

    def __str__(self) -> str:
        return f"{self.client.full_name} - {self.description}"

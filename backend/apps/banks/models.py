from django.db import models


class Bank(models.Model):
    class BankType(models.TextChoices):
        PRIVATE = 'PRIVATE', 'Private'
        GOVERNMENT = 'GOVERNMENT', 'Government'

    name = models.CharField(max_length=255)
    bank_type = models.CharField(max_length=32, choices=BankType.choices)
    address = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.name

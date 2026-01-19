from datetime import date

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.banks.models import Bank


class Client(models.Model):
    class PersonType(models.TextChoices):
        NATURAL = 'NATURAL', 'Natural'
        LEGAL_ENTITY = 'LEGAL_ENTITY', 'Legal Entity'

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(99)],
        help_text='Optional; if provided, it must match date of birth.'
    )
    nationality = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    person_type = models.CharField(max_length=32, choices=PersonType.choices, default=PersonType.NATURAL)
    bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')

    def __str__(self) -> str:
        return self.full_name

    @staticmethod
    def calculate_age(dob: date) -> int:
        today = date.today()
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return years

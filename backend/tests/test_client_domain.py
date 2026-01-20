from datetime import date

import pytest

from apps.banks.models import Bank
from apps.clients.api.serializers import ClientSerializer
from apps.clients.models import Client


@pytest.mark.django_db
def test_client_string_representation():
    bank = Bank.objects.create(name='Domain Bank', bank_type=Bank.BankType.PRIVATE)
    dob = date(1992, 3, 4)
    client = Client.objects.create(
        full_name='Domain User',
        date_of_birth=dob,
        age=Client.calculate_age(dob),
        email='domain@example.com',
        person_type=Client.PersonType.NATURAL,
        bank=bank,
    )

    assert str(client) == 'Domain User'


@pytest.mark.django_db
def test_client_serializer_rejects_age_mismatch():
    bank = Bank.objects.create(name='Mismatch Bank', bank_type=Bank.BankType.PUBLIC)
    dob = date(1988, 12, 11)

    serializer = ClientSerializer(
        data={
            'full_name': 'Mismatch User',
            'date_of_birth': dob,
            'age': Client.calculate_age(dob) + 1,
            'email': 'mismatch@example.com',
            'person_type': Client.PersonType.NATURAL,
            'bank': bank.id,
        }
    )

    assert not serializer.is_valid()
    assert 'age' in serializer.errors

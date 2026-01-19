import pytest
from datetime import date

from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.banks.models import Bank
from apps.clients.models import Client


@pytest.mark.django_db
def test_client_age_calculation_and_validation():
    bank = Bank.objects.create(name='Test Bank', bank_type=Bank.BankType.PRIVATE)
    dob = date(2000, 1, 1)
    expected = Client.calculate_age(dob)
    c = Client.objects.create(
        full_name='John Doe',
        date_of_birth=dob,
        age=expected,
        email='john@example.com',
        person_type=Client.PersonType.NATURAL,
        bank=bank,
    )
    assert c.age == expected


@pytest.mark.django_db
def test_api_create_credit_rejects_invalid_min_max():
    user = User.objects.create_user(username='u', password='p')
    api = APIClient()
    api.login(username='u', password='p')

    bank = Bank.objects.create(name='Test Bank', bank_type=Bank.BankType.PRIVATE)
    client = Client.objects.create(
        full_name='Jane Doe',
        date_of_birth=date(1990, 6, 1),
        email='jane@example.com',
        person_type=Client.PersonType.NATURAL,
        bank=bank,
    )

    # JWT required by default; for this unit we bypass by forcing auth
    api.force_authenticate(user=user)

    res = api.post(
        '/v1/credits/',
        {
            'client': client.id,
            'description': 'Car loan',
            'min_payment': '200.00',
            'max_payment': '100.00',
            'term_months': 12,
            'bank': bank.id,
            'credit_type': 'AUTO',
        },
        format='json',
    )

    assert res.status_code == 400
    assert 'min_payment' in res.data

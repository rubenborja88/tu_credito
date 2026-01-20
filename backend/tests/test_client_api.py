from datetime import date

import pytest

from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.banks.models import Bank
from apps.clients.models import Client


@pytest.mark.django_db
def test_client_create_and_list():
    user = User.objects.create_user(username='client-user', password='password123')
    api = APIClient()
    api.force_authenticate(user=user)

    bank = Bank.objects.create(name='Client Bank', bank_type=Bank.BankType.PRIVATE)
    dob = date(1995, 5, 10)

    response = api.post(
        '/v1/clients/',
        {
            'full_name': 'Alice Client',
            'date_of_birth': dob.isoformat(),
            'age': Client.calculate_age(dob),
            'email': 'alice@example.com',
            'person_type': Client.PersonType.NATURAL,
            'bank': bank.id,
        },
        format='json',
    )

    assert response.status_code == 201
    assert response.data['full_name'] == 'Alice Client'

    list_response = api.get('/v1/clients/')
    assert list_response.status_code == 200
    assert list_response.data['count'] == 1


@pytest.mark.django_db
def test_client_update():
    user = User.objects.create_user(username='client-update', password='password123')
    api = APIClient()
    api.force_authenticate(user=user)

    bank = Bank.objects.create(name='Update Bank', bank_type=Bank.BankType.PUBLIC)
    dob = date(1990, 8, 20)
    client = Client.objects.create(
        full_name='Old Name',
        date_of_birth=dob,
        age=Client.calculate_age(dob),
        email='old@example.com',
        person_type=Client.PersonType.NATURAL,
        bank=bank,
    )

    response = api.patch(
        f'/v1/clients/{client.id}/',
        {'full_name': 'New Name'},
        format='json',
    )

    assert response.status_code == 200
    assert response.data['full_name'] == 'New Name'

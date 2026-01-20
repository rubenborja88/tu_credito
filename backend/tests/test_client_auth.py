import pytest

from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_client_list_requires_auth():
    api = APIClient()

    response = api.get('/v1/clients/')

    assert response.status_code == 401


@pytest.mark.django_db
def test_client_list_with_mocked_auth():
    user = User.objects.create_user(username='auth-user', password='password123')
    api = APIClient()
    api.force_authenticate(user=user)

    response = api.get('/v1/clients/')

    assert response.status_code == 200
    assert response.data['results'] == []

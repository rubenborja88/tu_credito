#!/usr/bin/env sh
set -e

export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.dev}

python manage.py migrate --noinput

# Create a default admin user for review if it doesn't exist.
DJANGO_SUPERUSER_USERNAME=${DJANGO_SUPERUSER_USERNAME:-admin}
DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD:-admin12345}
DJANGO_SUPERUSER_EMAIL=${DJANGO_SUPERUSER_EMAIL:-admin@example.com}

python manage.py shell <<'PY'
from django.contrib.auth.models import User
import os

username = os.getenv("DJANGO_SUPERUSER_USERNAME")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
email = os.getenv("DJANGO_SUPERUSER_EMAIL")

user, created = User.objects.get_or_create(username=username, defaults={"email": email})
if created:
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()

print("Default admin ready:", username)
PY

exec gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 2 --timeout 60

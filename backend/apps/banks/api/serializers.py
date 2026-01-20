from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from apps.banks.models import Bank


class BankSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[
            UniqueValidator(queryset=Bank.objects.all(), lookup='iexact'),
        ]
    )

    class Meta:
        model = Bank
        fields = ('id', 'name', 'bank_type', 'address')

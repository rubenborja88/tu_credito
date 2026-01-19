from rest_framework import serializers

from apps.banks.models import Bank


class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bank
        fields = ('id', 'name', 'bank_type', 'address')

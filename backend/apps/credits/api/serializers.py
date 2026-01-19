from rest_framework import serializers

from apps.credits.models import Credit


class CreditSerializer(serializers.ModelSerializer):
    client_full_name = serializers.CharField(source='client.full_name', read_only=True)
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = Credit
        fields = (
            'id', 'client', 'client_full_name', 'description',
            'min_payment', 'max_payment', 'term_months', 'created_at',
            'bank', 'bank_name', 'credit_type'
        )
        read_only_fields = ('created_at',)

    def validate(self, attrs):
        min_p = attrs.get('min_payment') if 'min_payment' in attrs else getattr(self.instance, 'min_payment', None)
        max_p = attrs.get('max_payment') if 'max_payment' in attrs else getattr(self.instance, 'max_payment', None)
        if min_p is not None and max_p is not None and min_p > max_p:
            raise serializers.ValidationError({'min_payment': 'min_payment must be less than or equal to max_payment.'})

        # Optional consistency: if both client and bank are set, ensure they match.
        client = attrs.get('client') if 'client' in attrs else getattr(self.instance, 'client', None)
        bank = attrs.get('bank') if 'bank' in attrs else getattr(self.instance, 'bank', None)
        if client and bank and client.bank_id and client.bank_id != bank.id:
            raise serializers.ValidationError({'bank': 'Credit bank must match the client bank.'})

        return attrs

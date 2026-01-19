from rest_framework import serializers

from apps.clients.models import Client


class ClientSerializer(serializers.ModelSerializer):
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = Client
        fields = (
            'id', 'full_name', 'date_of_birth', 'age', 'nationality', 'address',
            'email', 'phone', 'person_type', 'bank', 'bank_name'
        )

    def validate(self, attrs):
        dob = attrs.get('date_of_birth') or getattr(self.instance, 'date_of_birth', None)
        age = attrs.get('age') if 'age' in attrs else getattr(self.instance, 'age', None)
        if dob and age is not None:
            calculated = Client.calculate_age(dob)
            if calculated != age:
                raise serializers.ValidationError({'age': f"Age does not match date of birth (expected {calculated})."})
        return attrs

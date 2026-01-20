import django_filters

from apps.clients.models import Client


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class ClientFilter(django_filters.FilterSet):
    full_name = django_filters.CharFilter(field_name='full_name', lookup_expr='icontains')
    email = django_filters.CharFilter(field_name='email', lookup_expr='icontains')
    bank_name = django_filters.CharFilter(field_name='bank__name', lookup_expr='icontains')
    person_type = CharInFilter(field_name='person_type', lookup_expr='in')
    bank = NumberInFilter(field_name='bank_id', lookup_expr='in')

    class Meta:
        model = Client
        fields = ('full_name', 'email', 'bank_name', 'person_type', 'bank')

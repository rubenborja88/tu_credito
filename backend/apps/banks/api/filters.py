import django_filters

from apps.banks.models import Bank


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class BankFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    address = django_filters.CharFilter(field_name='address', lookup_expr='icontains')
    bank_type = CharInFilter(field_name='bank_type', lookup_expr='in')

    class Meta:
        model = Bank
        fields = ('name', 'address', 'bank_type')

import django_filters
from django.db.models import CharField
from django.db.models.functions import Cast

from apps.credits.models import Credit


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class CreditFilter(django_filters.FilterSet):
    description = django_filters.CharFilter(field_name='description', lookup_expr='icontains')
    bank_name = django_filters.CharFilter(field_name='bank__name', lookup_expr='icontains')
    client_full_name = django_filters.CharFilter(field_name='client__full_name', lookup_expr='icontains')
    credit_type = CharInFilter(field_name='credit_type', lookup_expr='in')
    bank = NumberInFilter(field_name='bank_id', lookup_expr='in')
    min_payment = django_filters.CharFilter(method='filter_decimal_contains')
    max_payment = django_filters.CharFilter(method='filter_decimal_contains')
    term_months = django_filters.CharFilter(method='filter_integer_contains')

    class Meta:
        model = Credit
        fields = (
            'description',
            'bank_name',
            'client_full_name',
            'credit_type',
            'bank',
            'min_payment',
            'max_payment',
            'term_months',
        )

    def filter_decimal_contains(self, queryset, name, value):
        if not value:
            return queryset
        annotated = queryset.annotate(**{f'{name}_text': Cast(name, output_field=CharField())})
        return annotated.filter(**{f'{name}_text__icontains': value})

    def filter_integer_contains(self, queryset, name, value):
        if not value:
            return queryset
        annotated = queryset.annotate(**{f'{name}_text': Cast(name, output_field=CharField())})
        return annotated.filter(**{f'{name}_text__icontains': value})

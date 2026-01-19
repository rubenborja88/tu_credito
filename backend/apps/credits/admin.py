from django.contrib import admin

from .models import Credit


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'bank', 'credit_type', 'min_payment', 'max_payment', 'term_months', 'created_at')
    list_filter = ('credit_type', 'bank')
    search_fields = ('description', 'client__full_name')

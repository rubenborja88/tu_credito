from django.contrib import admin

from .models import Bank


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'bank_type')
    list_filter = ('bank_type',)
    search_fields = ('name',)

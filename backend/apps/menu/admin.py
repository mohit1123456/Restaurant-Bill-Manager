from django.contrib import admin

from apps.menu.models import MenuItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
	list_display = ["name", "category", "price_paise", "is_available"]
	list_filter = ["is_available", "category"]
	search_fields = ["name", "category"]

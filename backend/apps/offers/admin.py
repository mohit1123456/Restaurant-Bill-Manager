from django.contrib import admin

from apps.offers.models import Offer


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
	list_display = ["name", "discount_type", "discount_value", "priority", "is_active"]
	list_filter = ["discount_type", "stacking_policy", "is_active"]
	search_fields = ["name"]

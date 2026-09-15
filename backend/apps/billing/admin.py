from django.contrib import admin

from apps.billing.models import Bill, RestaurantSettings


@admin.register(RestaurantSettings)
class RestaurantSettingsAdmin(admin.ModelAdmin):
	list_display = [
		"gst_rate_basis_points",
		"packing_charge_paise",
		"delivery_fee_paise",
		"free_delivery_threshold_paise",
	]


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
	list_display = ["order", "total_paise", "created_at"]
	readonly_fields = ["created_at"]

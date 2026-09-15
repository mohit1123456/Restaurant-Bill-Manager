from django.contrib import admin

from apps.orders.models import Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ["id", "order_type", "status", "created_at"]
	list_filter = ["order_type", "status"]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = ["order", "item_name_snapshot", "quantity", "unit_price_paise_snapshot"]

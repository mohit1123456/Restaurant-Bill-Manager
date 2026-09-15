from django.db import transaction
from rest_framework import serializers

from apps.menu.models import MenuItem
from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all())

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item",
            "item_name_snapshot",
            "unit_price_paise_snapshot",
            "quantity",
        ]
        read_only_fields = ["id", "item_name_snapshot", "unit_price_paise_snapshot"]

    def validate(self, attrs):
        if not attrs["menu_item"].is_available:
            raise serializers.ValidationError("This menu item is not available.")
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["id", "order_type", "status", "items", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance is None and attrs.get("status", Order.Status.DRAFT) != Order.Status.DRAFT:
            raise serializers.ValidationError(
                {"status": "New orders must start in draft status."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        order = Order.objects.create(**validated_data)
        for item in items:
            OrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        requested_status = validated_data.get("status")
        if requested_status and requested_status != instance.status:
            if not instance.can_transition_to(requested_status):
                raise serializers.ValidationError(
                    {"status": "This order status transition is not allowed."}
                )
        return super().update(instance, validated_data)
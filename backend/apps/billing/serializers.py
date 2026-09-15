from rest_framework import serializers

from apps.billing.models import Bill


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = [
            "id",
            "order",
            "subtotal_paise",
            "discount_total_paise",
            "packing_charge_paise",
            "delivery_fee_paise",
            "taxable_amount_paise",
            "gst_paise",
            "total_paise",
            "breakdown",
            "created_at",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        breakdown = representation.get("breakdown") or {}
        representation["discounts"] = breakdown.get("discounts", [])
        representation["line_items"] = breakdown.get("line_items", [])
        representation["display"] = breakdown.get("display", {})
        return representation
from dataclasses import dataclass

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.billing.models import RestaurantSettings
from apps.billing.services.discounts import calculate_discounts
from apps.billing.services.fees import calculate_fees
from apps.billing.services.money import format_paise
from apps.billing.services.tax import calculate_gst
from apps.offers.models import Offer


@dataclass(frozen=True)
class BillResult:
    subtotal_paise: int
    discounts: list
    discount_total_paise: int
    packing_charge_paise: int
    delivery_fee_paise: int
    taxable_amount_paise: int
    gst_paise: int
    total_paise: int
    line_items: list

    def as_dict(self):
        return {
            "subtotal_paise": self.subtotal_paise,
            "discounts": self.discounts,
            "discount_total_paise": self.discount_total_paise,
            "packing_charge_paise": self.packing_charge_paise,
            "delivery_fee_paise": self.delivery_fee_paise,
            "taxable_amount_paise": self.taxable_amount_paise,
            "gst_paise": self.gst_paise,
            "total_paise": self.total_paise,
            "line_items": self.line_items,
            "display": {
                "subtotal": format_paise(self.subtotal_paise),
                "discount_total": format_paise(self.discount_total_paise),
                "packing_charge": format_paise(self.packing_charge_paise),
                "delivery_fee": format_paise(self.delivery_fee_paise),
                "gst": format_paise(self.gst_paise),
                "total": format_paise(self.total_paise),
            },
        }


def calculate_bill(order, pricing_context=None):
    if not order.items.exists():
        raise ValidationError("An order must contain at least one item.")

    pricing_context = pricing_context or {}
    settings = pricing_context.get("settings") or RestaurantSettings.objects.first()
    settings = settings or RestaurantSettings()
    offers = pricing_context.get("offers")
    if offers is None:
        offers = Offer.objects.all()
    now = pricing_context.get("now") or timezone.now()

    line_items = []
    subtotal_paise = 0
    for item in order.items.all():
        line_total_paise = item.unit_price_paise_snapshot * item.quantity
        subtotal_paise += line_total_paise
        line_items.append(
            {
                "order_item_id": item.id,
                "name": item.item_name_snapshot,
                "quantity": item.quantity,
                "unit_price_paise": item.unit_price_paise_snapshot,
                "line_total_paise": line_total_paise,
            }
        )

    discounts = calculate_discounts(offers, subtotal_paise, now=now)
    discount_total_paise = sum(item["amount_paise"] for item in discounts)
    discounted_subtotal_paise = subtotal_paise - discount_total_paise
    packing_charge_paise, delivery_fee_paise = calculate_fees(
        order,
        subtotal_paise,
        settings,
    )
    taxable_amount_paise = (
        discounted_subtotal_paise + packing_charge_paise + delivery_fee_paise
    )
    gst_paise = calculate_gst(taxable_amount_paise, settings.gst_rate_basis_points)

    return BillResult(
        subtotal_paise=subtotal_paise,
        discounts=discounts,
        discount_total_paise=discount_total_paise,
        packing_charge_paise=packing_charge_paise,
        delivery_fee_paise=delivery_fee_paise,
        taxable_amount_paise=taxable_amount_paise,
        gst_paise=gst_paise,
        total_paise=taxable_amount_paise + gst_paise,
        line_items=line_items,
    )
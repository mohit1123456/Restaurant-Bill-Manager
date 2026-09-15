from django.utils import timezone

from apps.billing.services.money import percentage_of
from apps.offers.models import Offer


def _offer_discount(offer, base_paise):
    if offer.discount_type == Offer.DiscountType.FIXED:
        discount = offer.discount_value
    else:
        discount = percentage_of(base_paise, offer.discount_value)
    if offer.maximum_discount_paise is not None:
        discount = min(discount, offer.maximum_discount_paise)
    return min(discount, base_paise)


def eligible_offers(offers, subtotal_paise, now=None):
    now = now or timezone.now()
    return [
        offer
        for offer in offers
        if offer.is_active
        and subtotal_paise >= offer.minimum_order_paise
        and (offer.valid_from is None or now >= offer.valid_from)
        and (offer.valid_until is None or now < offer.valid_until)
    ]


def calculate_discounts(offers, subtotal_paise, now=None):
    eligible = sorted(
        eligible_offers(offers, subtotal_paise, now=now),
        key=lambda offer: (-offer.priority, offer.id or 0),
    )
    exclusive = [
        offer
        for offer in eligible
        if offer.stacking_policy == Offer.StackingPolicy.EXCLUSIVE
    ]
    if exclusive:
        eligible = exclusive[:1]
    applied = []
    remaining_paise = subtotal_paise

    for offer in eligible:
        discount_paise = _offer_discount(offer, remaining_paise)
        if discount_paise == 0:
            continue
        applied.append(
            {
                "offer_id": offer.id,
                "name": offer.name,
                "amount_paise": discount_paise,
                "reason": "Eligible",
            }
        )
        remaining_paise -= discount_paise
        if offer.stacking_policy == Offer.StackingPolicy.EXCLUSIVE or remaining_paise == 0:
            break

    return applied
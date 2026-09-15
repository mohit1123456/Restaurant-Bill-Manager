from apps.orders.models import Order


def calculate_fees(order, subtotal_paise, settings):
    packing_charge_paise = settings.packing_charge_paise
    delivery_fee_paise = 0
    if order.order_type == Order.OrderType.DELIVERY:
        delivery_fee_paise = settings.delivery_fee_paise
        if (
            settings.free_delivery_threshold_paise > 0
            and subtotal_paise >= settings.free_delivery_threshold_paise
        ):
            delivery_fee_paise = 0
    return packing_charge_paise, delivery_fee_paise
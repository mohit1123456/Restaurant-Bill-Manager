from django.core.management.base import BaseCommand

from apps.billing.models import Bill, RestaurantSettings
from apps.billing.services.calculator import calculate_bill
from apps.menu.models import MenuItem
from apps.offers.models import Offer
from apps.orders.models import Order, OrderItem


class Command(BaseCommand):
    help = "Create or update realistic demo menu, offer, order, and bill data."

    def handle(self, *args, **options):
        settings, _ = RestaurantSettings.objects.update_or_create(
            pk=1,
            defaults={
                "gst_rate_basis_points": 500,
                "packing_charge_paise": 200,
                "delivery_fee_paise": 500,
                "free_delivery_threshold_paise": 100000,
            },
        )

        menu_data = [
            ("Butter Chicken", "Mains", 32000, True),
            ("Paneer Tikka", "Starters", 25000, True),
            ("Masala Dosa", "Mains", 18000, True),
            ("Garlic Naan", "Breads", 6000, True),
            ("Mango Lassi", "Drinks", 8000, True),
            ("Gulab Jamun", "Desserts", 9000, True),
            ("Seasonal Thali", "Mains", 45000, False),
        ]
        menu_items = {}
        for name, category, price_paise, is_available in menu_data:
            item, _ = MenuItem.objects.update_or_create(
                name=name,
                defaults={
                    "category": category,
                    "price_paise": price_paise,
                    "is_available": is_available,
                },
            )
            menu_items[name] = item

        offer_data = [
            {
                "name": "Welcome 10%",
                "discount_type": Offer.DiscountType.PERCENTAGE,
                "minimum_order_paise": 50000,
                "discount_value": 1000,
                "maximum_discount_paise": 15000,
                "priority": 20,
                "stacking_policy": Offer.StackingPolicy.EXCLUSIVE,
                "is_active": True,
            },
            {
                "name": "Flat ₹50 off",
                "discount_type": Offer.DiscountType.FIXED,
                "minimum_order_paise": 80000,
                "discount_value": 5000,
                "maximum_discount_paise": None,
                "priority": 10,
                "stacking_policy": Offer.StackingPolicy.STACKABLE,
                "is_active": True,
            },
            {
                "name": "Weekend dessert bonus",
                "discount_type": Offer.DiscountType.FIXED,
                "minimum_order_paise": 120000,
                "discount_value": 1000,
                "maximum_discount_paise": None,
                "priority": 5,
                "stacking_policy": Offer.StackingPolicy.STACKABLE,
                "is_active": False,
            },
        ]
        for offer in offer_data:
            Offer.objects.update_or_create(name=offer["name"], defaults=offer)

        order_data = [
            ("Dine-in table 4", Order.OrderType.DINE_IN, Order.Status.COMPLETED, [("Butter Chicken", 1), ("Garlic Naan", 2), ("Mango Lassi", 1)]),
            ("Takeaway lunch", Order.OrderType.TAKEAWAY, Order.Status.CONFIRMED, [("Paneer Tikka", 1), ("Masala Dosa", 2)]),
            ("Delivery order", Order.OrderType.DELIVERY, Order.Status.DRAFT, [("Butter Chicken", 1), ("Gulab Jamun", 2)]),
        ]
        completed_bill = None
        for label, order_type, status, lines in order_data:
            order = Order.objects.filter(
                order_type=order_type,
                status=status,
            ).order_by("id").first()
            created = order is None
            if created:
                order = Order.objects.create(order_type=order_type, status=status)
            else:
                order.status = status
                order.save(update_fields=["status", "updated_at"])
                order.items.all().delete()
            for item_name, quantity in lines:
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_items[item_name],
                    quantity=quantity,
                )
            if status == Order.Status.COMPLETED:
                result = calculate_bill(order, {"settings": settings})
                completed_bill, _ = Bill.objects.update_or_create(
                    order=order,
                    defaults={
                        "subtotal_paise": result.subtotal_paise,
                        "discount_total_paise": result.discount_total_paise,
                        "packing_charge_paise": result.packing_charge_paise,
                        "delivery_fee_paise": result.delivery_fee_paise,
                        "taxable_amount_paise": result.taxable_amount_paise,
                        "gst_paise": result.gst_paise,
                        "total_paise": result.total_paise,
                        "breakdown": result.as_dict(),
                    },
                )
            self.stdout.write(f"Seeded {label}: order #{order.id}")

        if completed_bill:
            self.stdout.write(f"Seeded completed bill #{completed_bill.id}")
        self.stdout.write(self.style.SUCCESS("Demo data is ready."))

from django.test import TestCase

from apps.menu.models import MenuItem
from apps.orders.models import Order, OrderItem


class OrderItemSnapshotTests(TestCase):
    def test_order_item_keeps_menu_name_and_price_snapshot(self):
        menu_item = MenuItem.objects.create(
            name="Paneer Tikka",
            price_paise=25000,
        )
        order = Order.objects.create(order_type=Order.OrderType.DINE_IN)
        order_item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            quantity=2,
        )

        menu_item.name = "Paneer Tikka Special"
        menu_item.price_paise = 30000
        menu_item.save()

        order_item.refresh_from_db()
        self.assertEqual(order_item.item_name_snapshot, "Paneer Tikka")
        self.assertEqual(order_item.unit_price_paise_snapshot, 25000)

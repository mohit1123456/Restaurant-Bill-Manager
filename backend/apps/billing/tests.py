from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.billing.models import RestaurantSettings
from apps.billing.services.calculator import calculate_bill
from apps.billing.services.money import format_paise, percentage_of
from apps.menu.models import MenuItem
from apps.offers.models import Offer
from apps.orders.models import Order, OrderItem


class MoneyTests(TestCase):
    def test_percentage_rounds_half_up_in_paise(self):
        self.assertEqual(percentage_of(1, 5000), 1)
        self.assertEqual(percentage_of(1, 4900), 0)

    def test_display_format(self):
        self.assertEqual(format_paise(12550), "₹125.50")


class BillCalculationTests(TestCase):
    def setUp(self):
        self.settings = RestaurantSettings(
            gst_rate_basis_points=500,
            packing_charge_paise=200,
            delivery_fee_paise=500,
            free_delivery_threshold_paise=30000,
        )
        self.menu_item = MenuItem.objects.create(
            name="Thali",
            price_paise=12500,
        )

    def create_order(self, quantities=(1,), order_type=Order.OrderType.DINE_IN):
        order = Order.objects.create(order_type=order_type)
        for quantity in quantities:
            OrderItem.objects.create(
                order=order,
                menu_item=self.menu_item,
                quantity=quantity,
            )
        return order

    def calculate(self, order, offers=()):
        return calculate_bill(
            order,
            {"settings": self.settings, "offers": offers},
        )

    def test_single_item_and_multiple_quantity_subtotal(self):
        result = self.calculate(self.create_order(quantities=(2,)))
        self.assertEqual(result.subtotal_paise, 25000)
        self.assertEqual(result.line_items[0]["line_total_paise"], 25000)

    def test_multiple_items_subtotal(self):
        second_item = MenuItem.objects.create(name="Lassi", price_paise=5000)
        order = self.create_order()
        OrderItem.objects.create(order=order, menu_item=second_item, quantity=2)
        result = self.calculate(order)
        self.assertEqual(result.subtotal_paise, 22500)

    def test_fixed_discount_and_cap(self):
        order = self.create_order(quantities=(2,))
        offer = Offer.objects.create(
            name="Flat discount",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=10000,
            maximum_discount_paise=3000,
            stacking_policy=Offer.StackingPolicy.EXCLUSIVE,
        )
        result = self.calculate(order, [offer])
        self.assertEqual(result.discount_total_paise, 3000)

    def test_percentage_discount_uses_remaining_subtotal(self):
        order = self.create_order(quantities=(2,))
        offer = Offer.objects.create(
            name="Ten percent",
            discount_type=Offer.DiscountType.PERCENTAGE,
            discount_value=1000,
            stacking_policy=Offer.StackingPolicy.EXCLUSIVE,
        )
        result = self.calculate(order, [offer])
        self.assertEqual(result.discount_total_paise, 2500)

    def test_threshold_and_validity_filter_ineligible_offers(self):
        order = self.create_order()
        now = timezone.now()
        offer = Offer.objects.create(
            name="Future offer",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=1000,
            minimum_order_paise=20000,
            valid_from=now + timedelta(days=1),
        )
        result = self.calculate(order, [offer])
        self.assertEqual(result.discounts, [])

    def test_exclusive_priority_stops_lower_priority_offer(self):
        order = self.create_order(quantities=(2,))
        high_priority = Offer.objects.create(
            name="Priority offer",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=3000,
            priority=10,
            stacking_policy=Offer.StackingPolicy.EXCLUSIVE,
        )
        lower_priority = Offer.objects.create(
            name="Lower offer",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=2000,
            priority=1,
            stacking_policy=Offer.StackingPolicy.STACKABLE,
        )
        result = self.calculate(order, [lower_priority, high_priority])
        self.assertEqual([item["name"] for item in result.discounts], ["Priority offer"])

    def test_stackable_offers_apply_in_priority_order(self):
        order = self.create_order(quantities=(2,))
        first = Offer.objects.create(
            name="First stackable",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=1000,
            priority=10,
            stacking_policy=Offer.StackingPolicy.STACKABLE,
        )
        second = Offer.objects.create(
            name="Second stackable",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=500,
            priority=1,
            stacking_policy=Offer.StackingPolicy.STACKABLE,
        )
        result = self.calculate(order, [second, first])
        self.assertEqual(
            [item["name"] for item in result.discounts],
            ["First stackable", "Second stackable"],
        )

    def test_discounts_never_make_subtotal_negative(self):
        order = self.create_order()
        offer = Offer.objects.create(
            name="Large discount",
            discount_type=Offer.DiscountType.FIXED,
            discount_value=999999,
            stacking_policy=Offer.StackingPolicy.EXCLUSIVE,
        )
        result = self.calculate(order, [offer])
        self.assertEqual(result.discount_total_paise, result.subtotal_paise)
        self.assertGreaterEqual(result.total_paise, 0)

    def test_delivery_fee_and_free_delivery_boundary(self):
        regular = self.calculate(self.create_order(order_type=Order.OrderType.DELIVERY))
        free = self.calculate(
            self.create_order(quantities=(3,), order_type=Order.OrderType.DELIVERY)
        )
        self.assertEqual(regular.delivery_fee_paise, 500)
        self.assertEqual(free.delivery_fee_paise, 0)

    def test_packing_charge_taxable_amount_and_gst(self):
        result = self.calculate(self.create_order())
        self.assertEqual(result.packing_charge_paise, 200)
        self.assertEqual(result.taxable_amount_paise, 12700)
        self.assertEqual(result.gst_paise, 635)
        self.assertEqual(result.total_paise, 13335)

    def test_free_delivery_applies_at_exact_threshold(self):
        exact_item = MenuItem.objects.create(name="Large order", price_paise=30000)
        order = Order.objects.create(order_type=Order.OrderType.DELIVERY)
        OrderItem.objects.create(order=order, menu_item=exact_item, quantity=1)
        result = self.calculate(order)
        self.assertEqual(result.delivery_fee_paise, 0)

    def test_gst_rounding_boundary(self):
        one_paisa_item = MenuItem.objects.create(name="Sample", price_paise=1)
        order = Order.objects.create(order_type=Order.OrderType.DINE_IN)
        OrderItem.objects.create(order=order, menu_item=one_paisa_item, quantity=1)
        self.settings.gst_rate_basis_points = 5000
        self.settings.packing_charge_paise = 0
        result = self.calculate(order)
        self.assertEqual(result.gst_paise, 1)

    def test_empty_order_is_rejected(self):
        order = Order.objects.create(order_type=Order.OrderType.DINE_IN)
        with self.assertRaises(ValidationError):
            self.calculate(order)


class BillingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.menu_item = MenuItem.objects.create(name="Idli", price_paise=8000)

    def create_order(self):
        response = self.client.post(
            "/api/orders/",
            {"order_type": "dine_in", "items": [{"menu_item": self.menu_item.id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return response.json()["id"]

    def test_preview_does_not_finalize_and_finalize_is_idempotent(self):
        order_id = self.create_order()
        preview = self.client.post("/api/billing/preview/", {"order_id": order_id}, format="json")
        self.assertEqual(preview.status_code, 200)
        self.assertFalse(Order.objects.get(id=order_id).status == Order.Status.COMPLETED)

        first = self.client.post("/api/billing/finalize/", {"order_id": order_id}, format="json")
        second = self.client.post("/api/billing/finalize/", {"order_id": order_id}, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json()["total_paise"], second.json()["total_paise"])
        self.assertIsInstance(first.json()["discounts"], list)
        self.assertIsInstance(second.json()["discounts"], list)

    def test_unavailable_item_cannot_be_added(self):
        self.menu_item.is_available = False
        self.menu_item.save()
        response = self.client.post(
            "/api/orders/",
            {"order_type": "dine_in", "items": [{"menu_item": self.menu_item.id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_order_status_transition_is_rejected(self):
        order_id = self.create_order()
        response = self.client.patch(
            f"/api/orders/{order_id}/",
            {"status": "completed"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

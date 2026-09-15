from django.db import models

from apps.menu.models import MenuItem


class Order(models.Model):
	class OrderType(models.TextChoices):
		DINE_IN = "dine_in", "Dine in"
		TAKEAWAY = "takeaway", "Takeaway"
		DELIVERY = "delivery", "Delivery"

	class Status(models.TextChoices):
		DRAFT = "draft", "Draft"
		CONFIRMED = "confirmed", "Confirmed"
		COMPLETED = "completed", "Completed"
		CANCELLED = "cancelled", "Cancelled"

	ALLOWED_STATUS_TRANSITIONS = {
		Status.DRAFT: {Status.CONFIRMED, Status.CANCELLED},
		Status.CONFIRMED: {Status.COMPLETED, Status.CANCELLED},
		Status.COMPLETED: set(),
		Status.CANCELLED: set(),
	}

	order_type = models.CharField(max_length=20, choices=OrderType.choices)
	status = models.CharField(
		max_length=20,
		choices=Status.choices,
		default=Status.DRAFT,
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"Order #{self.pk or 'new'}"

	def can_transition_to(self, new_status):
		return new_status in self.ALLOWED_STATUS_TRANSITIONS[self.status]


class OrderItem(models.Model):
	order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
	menu_item = models.ForeignKey(
		MenuItem,
		on_delete=models.PROTECT,
		related_name="order_items",
	)
	item_name_snapshot = models.CharField(max_length=200)
	unit_price_paise_snapshot = models.PositiveBigIntegerField()
	quantity = models.PositiveIntegerField()

	class Meta:
		constraints = [
			models.CheckConstraint(
				condition=models.Q(quantity__gt=0),
				name="order_item_quantity_positive",
			),
		]

	def save(self, *args, **kwargs):
		if self._state.adding:
			self.item_name_snapshot = self.menu_item.name
			self.unit_price_paise_snapshot = self.menu_item.price_paise
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.quantity} x {self.item_name_snapshot}"

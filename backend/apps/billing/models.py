from django.db import models

from apps.orders.models import Order


class RestaurantSettings(models.Model):
	gst_rate_basis_points = models.PositiveIntegerField(default=500)
	packing_charge_paise = models.PositiveBigIntegerField(default=0)
	delivery_fee_paise = models.PositiveBigIntegerField(default=0)
	free_delivery_threshold_paise = models.PositiveBigIntegerField(default=0)

	class Meta:
		verbose_name = "Restaurant settings"
		verbose_name_plural = "Restaurant settings"

	def save(self, *args, **kwargs):
		self.pk = 1
		super().save(*args, **kwargs)

	def __str__(self):
		return "Restaurant settings"


class Bill(models.Model):
	order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name="bill")
	subtotal_paise = models.PositiveBigIntegerField()
	discount_total_paise = models.PositiveBigIntegerField()
	packing_charge_paise = models.PositiveBigIntegerField()
	delivery_fee_paise = models.PositiveBigIntegerField()
	taxable_amount_paise = models.PositiveBigIntegerField()
	gst_paise = models.PositiveBigIntegerField()
	total_paise = models.PositiveBigIntegerField()
	breakdown = models.JSONField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at"]

	def __str__(self):
		return f"Bill for order #{self.order_id}"

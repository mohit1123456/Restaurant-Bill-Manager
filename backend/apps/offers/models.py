from django.db import models


class Offer(models.Model):
	class DiscountType(models.TextChoices):
		FIXED = "fixed", "Fixed amount"
		PERCENTAGE = "percentage", "Percentage"

	class StackingPolicy(models.TextChoices):
		EXCLUSIVE = "exclusive", "Exclusive"
		STACKABLE = "stackable", "Stackable"

	name = models.CharField(max_length=200)
	discount_type = models.CharField(
		max_length=20,
		choices=DiscountType.choices,
	)
	minimum_order_paise = models.PositiveBigIntegerField(default=0)
	discount_value = models.PositiveBigIntegerField()
	maximum_discount_paise = models.PositiveBigIntegerField(null=True, blank=True)
	priority = models.PositiveIntegerField(default=0)
	is_active = models.BooleanField(default=True)
	stacking_policy = models.CharField(
		max_length=20,
		choices=StackingPolicy.choices,
		default=StackingPolicy.EXCLUSIVE,
	)
	valid_from = models.DateTimeField(null=True, blank=True)
	valid_until = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ["-priority", "id"]

	def clean(self):
		from django.core.exceptions import ValidationError

		errors = {}
		if self.valid_from and self.valid_until and self.valid_from >= self.valid_until:
			errors["valid_until"] = "valid_until must be after valid_from."
		if self.discount_type == self.DiscountType.PERCENTAGE and self.discount_value > 10000:
			errors["discount_value"] = "Percentage discounts cannot exceed 10000 basis points."
		if errors:
			raise ValidationError(errors)

	def __str__(self):
		return self.name

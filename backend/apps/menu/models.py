from django.db import models


class MenuItem(models.Model):
	name = models.CharField(max_length=200)
	category = models.CharField(max_length=100, blank=True)
	price_paise = models.PositiveBigIntegerField()
	is_available = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["category", "name"]
		indexes = [
			models.Index(fields=["is_available", "category"]),
		]

	def __str__(self):
		return self.name

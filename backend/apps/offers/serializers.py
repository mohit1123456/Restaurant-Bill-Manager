from rest_framework import serializers

from apps.offers.models import Offer


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = "__all__"
        read_only_fields = ["id"]

    def validate(self, attrs):
        instance = Offer(**attrs)
        instance.clean()
        return attrs
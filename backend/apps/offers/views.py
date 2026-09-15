from rest_framework.viewsets import ModelViewSet

from apps.offers.models import Offer
from apps.offers.serializers import OfferSerializer


class OfferViewSet(ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer

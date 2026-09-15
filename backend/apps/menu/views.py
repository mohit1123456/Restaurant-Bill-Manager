from rest_framework.viewsets import ModelViewSet

from apps.menu.models import MenuItem
from apps.menu.serializers import MenuItemSerializer


class MenuItemViewSet(ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

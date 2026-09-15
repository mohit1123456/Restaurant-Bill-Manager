"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.billing.views import BillDetailView, BillFinalizeView, BillPreviewView
from apps.menu.views import MenuItemViewSet
from apps.offers.views import OfferViewSet
from apps.orders.views import OrderViewSet
from config.views import health_check

router = DefaultRouter()
router.register("menu/items", MenuItemViewSet, basename="menu-item")
router.register("offers", OfferViewSet, basename="offer")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/", include(router.urls)),
    path("api/billing/preview/", BillPreviewView.as_view(), name="bill-preview"),
    path("api/billing/finalize/", BillFinalizeView.as_view(), name="bill-finalize"),
    path("api/billing/<int:order_id>/", BillDetailView.as_view(), name="bill-detail"),
]

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.models import Bill
from apps.billing.serializers import BillSerializer
from apps.billing.services.calculator import calculate_bill
from apps.orders.models import Order


def _order_from_request(request):
    order_id = request.data.get("order_id")
    if not order_id:
        return None
    return get_object_or_404(Order, pk=order_id)


class BillPreviewView(APIView):
    def post(self, request):
        order = _order_from_request(request)
        if order is None:
            return Response(
                {"detail": "order_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = calculate_bill(order)
        return Response(result.as_dict())


class BillFinalizeView(APIView):
    @transaction.atomic
    def post(self, request):
        order = _order_from_request(request)
        if order is None:
            return Response(
                {"detail": "order_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = calculate_bill(order)
        bill, created = Bill.objects.get_or_create(
            order=order,
            defaults={
                "subtotal_paise": result.subtotal_paise,
                "discount_total_paise": result.discount_total_paise,
                "packing_charge_paise": result.packing_charge_paise,
                "delivery_fee_paise": result.delivery_fee_paise,
                "taxable_amount_paise": result.taxable_amount_paise,
                "gst_paise": result.gst_paise,
                "total_paise": result.total_paise,
                "breakdown": result.as_dict(),
            },
        )
        if not created:
            return Response(BillSerializer(bill).data)
        order.status = Order.Status.COMPLETED
        order.save(update_fields=["status", "updated_at"])
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)


class BillDetailView(APIView):
    def get(self, request, order_id):
        bill = get_object_or_404(Bill, order_id=order_id)
        return Response(BillSerializer(bill).data)

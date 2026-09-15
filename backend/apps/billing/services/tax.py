from apps.billing.services.money import percentage_of


def calculate_gst(taxable_amount_paise, gst_rate_basis_points):
    return percentage_of(taxable_amount_paise, gst_rate_basis_points)
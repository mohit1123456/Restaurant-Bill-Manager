def round_half_up(numerator: int, denominator: int) -> int:
    if denominator <= 0:
        raise ValueError("denominator must be positive")
    if numerator < 0:
        raise ValueError("numerator must not be negative")
    quotient, remainder = divmod(numerator, denominator)
    if remainder * 2 >= denominator:
        return quotient + 1
    return quotient


def percentage_of(amount_paise: int, rate_basis_points: int) -> int:
    if amount_paise < 0 or rate_basis_points < 0:
        raise ValueError("money and rates must not be negative")
    return round_half_up(amount_paise * rate_basis_points, 10000)


def format_paise(amount_paise: int) -> str:
    if amount_paise < 0:
        raise ValueError("money must not be negative")
    return f"₹{amount_paise // 100}.{amount_paise % 100:02d}"
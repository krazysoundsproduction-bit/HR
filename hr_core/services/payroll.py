from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


TWO_DP = Decimal("0.01")


def _q(amount: Decimal) -> Decimal:
    return amount.quantize(TWO_DP, rounding=ROUND_HALF_UP)


def calculate_png_swt(gross_earnings: Decimal) -> Decimal:
    gross = Decimal(gross_earnings)
    if gross <= Decimal("500.00"):
        tax = gross * Decimal("0.20")
    elif gross <= Decimal("1500.00"):
        tax = Decimal("100.00") + (gross - Decimal("500.00")) * Decimal("0.30")
    else:
        tax = Decimal("400.00") + (gross - Decimal("1500.00")) * Decimal("0.35")
    return _q(tax)


@dataclass(frozen=True)
class PayrollBreakdown:
    gross_earnings: Decimal
    swt: Decimal
    super_employee_6pct: Decimal
    super_employer_8_4pct: Decimal
    net_pay: Decimal


def calculate_fortnightly_pay(base_salary: Decimal, active_allowances_total: Decimal) -> PayrollBreakdown:
    gross = _q(Decimal(base_salary) + Decimal(active_allowances_total))
    swt = calculate_png_swt(gross)
    super_employee = _q(gross * Decimal("0.06"))
    super_employer = _q(gross * Decimal("0.084"))
    net_pay = _q(gross - swt - super_employee)
    return PayrollBreakdown(
        gross_earnings=gross,
        swt=swt,
        super_employee_6pct=super_employee,
        super_employer_8_4pct=super_employer,
        net_pay=net_pay,
    )

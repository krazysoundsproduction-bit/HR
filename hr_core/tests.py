from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from hr_core.models import Department, DutyStation, Employee, EmployeeContract
from hr_core.services.payroll import calculate_fortnightly_pay


class PayrollCalculationTests(TestCase):
    def test_fortnightly_calculation_includes_swt_and_super(self):
        result = calculate_fortnightly_pay(Decimal("2000.00"), Decimal("300.00"))

        self.assertEqual(result.gross_earnings, Decimal("2300.00"))
        self.assertEqual(result.swt, Decimal("680.00"))
        self.assertEqual(result.super_employee_6pct, Decimal("138.00"))
        self.assertEqual(result.super_employer_8_4pct, Decimal("193.20"))
        self.assertEqual(result.net_pay, Decimal("1482.00"))


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ContractReminderCommandTests(TestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(username="e1")
        self.employee = Employee.objects.create(
            user=user,
            full_name="Employee One",
            employee_id="EMP-1",
            business_email="employee1@example.com",
            job_description="Analyst",
            department=Department.CONSUMER_PROTECTION,
            duty_station=DutyStation.PORT_MORESBY,
            base_fortnightly_salary=Decimal("1500.00"),
        )
        self.contract = EmployeeContract.objects.create(
            employee=self.employee,
            start_date=timezone.localdate() - timedelta(days=100),
            end_date=timezone.localdate() + timedelta(days=7),
            is_active=True,
            reminder_sent_7days=False,
        )

    def test_reminder_sent_once_and_flagged(self):
        call_command("send_contract_expiry_reminders")
        self.contract.refresh_from_db()

        self.assertTrue(self.contract.reminder_sent_7days)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("hr-manager@iccc.gov.pg", mail.outbox[0].cc)

        call_command("send_contract_expiry_reminders")
        self.assertEqual(len(mail.outbox), 1)

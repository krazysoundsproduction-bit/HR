from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.db import transaction
from django.utils import timezone

from hr_core.models import EmployeeContract


class Command(BaseCommand):
    help = "Send 7-day contract expiry reminders and set reminder_sent_7days=True exactly once."

    @transaction.atomic
    def handle(self, *args, **options):
        target_date = timezone.localdate() + timedelta(days=7)
        contracts = EmployeeContract.objects.select_related("employee").filter(
            is_active=True,
            end_date=target_date,
            reminder_sent_7days=False,
        )
        sent_count = 0
        for contract in contracts:
            msg = EmailMessage(
                subject="Contract expiry reminder (7 days)",
                body=(
                    f"Dear {contract.employee.full_name},\n\n"
                    f"Your contract is due to expire on {contract.end_date}."
                ),
                to=[contract.employee.business_email],
                cc=[settings.HR_CONTRACT_REMINDER_CC],
            )
            msg.send(fail_silently=False)
            contract.reminder_sent_7days = True
            contract.save(update_fields=["reminder_sent_7days", "updated_at"])
            sent_count += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {sent_count} reminder(s)."))

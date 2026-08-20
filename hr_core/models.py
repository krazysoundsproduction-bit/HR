from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Department(models.TextChoices):
    CONSUMER_PROTECTION = "consumer_protection", "Consumer Protection"
    COMPETITION = "competition", "Competition"
    CORPORATE_SERVICES = "corporate_services", "Corporate Services"
    LEGAL = "legal", "Legal"


class DutyStation(models.TextChoices):
    PORT_MORESBY = "port_moresby", "Port Moresby"
    LAE = "lae", "Lae"
    KOKOPO = "kokopo", "Kokopo"


class Role(models.TextChoices):
    SYSTEM_ADMIN = "system_admin", "System Administrator"
    HR_MANAGER = "hr_manager", "HR Manager"
    LINE_MANAGER = "line_manager", "Line Manager"
    STAFF = "staff", "Staff"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.STAFF)
    department = models.CharField(max_length=32, choices=Department.choices, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    full_name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=64, unique=True)
    business_email = models.EmailField(unique=True)
    job_description = models.CharField(max_length=255)
    department = models.CharField(max_length=32, choices=Department.choices)
    duty_station = models.CharField(max_length=32, choices=DutyStation.choices)
    base_fortnightly_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_employees",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"


class EmployeeContract(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="contracts")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    reminder_sent_7days = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("end_date must be after start_date")


class Allowance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="allowances")
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.employee.employee_id}: {self.name}"


class PayrollLedger(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="payroll_rows")
    period_start = models.DateField()
    period_end = models.DateField()
    gross_earnings = models.DecimalField(max_digits=12, decimal_places=2)
    swt = models.DecimalField(max_digits=12, decimal_places=2)
    super_employee_6pct = models.DecimalField(max_digits=12, decimal_places=2)
    super_employer_8_4pct = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action_executed = models.TextField()
    ip_address = models.GenericIPAddressField()

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("AuditLog rows are immutable")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("AuditLog rows cannot be deleted")

from django.contrib import admin

from hr_core.models import Allowance, AuditLog, Employee, EmployeeContract, PayrollLedger, UserProfile


admin.site.register(UserProfile)
admin.site.register(Employee)
admin.site.register(EmployeeContract)
admin.site.register(Allowance)
admin.site.register(PayrollLedger)
admin.site.register(AuditLog)

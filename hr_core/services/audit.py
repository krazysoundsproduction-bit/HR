from hr_core.models import AuditLog


def log_admin_action(*, user, action_executed: str, ip_address: str) -> AuditLog:
    return AuditLog.objects.create(
        user=user,
        action_executed=action_executed,
        ip_address=ip_address,
    )

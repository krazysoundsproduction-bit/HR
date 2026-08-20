from hr_core.models import Employee, Role, UserProfile


def _role_for(user):
    try:
        return user.userprofile.role
    except UserProfile.DoesNotExist:
        return Role.STAFF


def can_edit_employee(actor, employee: Employee) -> bool:
    return _role_for(actor) in {Role.SYSTEM_ADMIN, Role.HR_MANAGER}


def can_view_employee(actor, employee: Employee) -> bool:
    role = _role_for(actor)
    if role in {Role.SYSTEM_ADMIN, Role.HR_MANAGER}:
        return True
    if role == Role.LINE_MANAGER:
        return employee.department == actor.userprofile.department
    return employee.user_id == actor.id


def can_signoff_leave(actor, employee: Employee) -> bool:
    return _role_for(actor) == Role.LINE_MANAGER and employee.department == actor.userprofile.department

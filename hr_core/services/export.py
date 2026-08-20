import base64
import csv
import io
import os
from hashlib import pbkdf2_hmac

from cryptography.fernet import Fernet


def _derive_fernet_from_password(password: str, salt: bytes) -> Fernet:
    key = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000, dklen=32)
    return Fernet(base64.urlsafe_b64encode(key))


def export_locked_ledger_rows_to_encrypted_csv(rows, password: str, output_path: str) -> str:
    if not password or len(password) < 10:
        raise ValueError("Password must be at least 10 characters")

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "employee_id",
            "employee_name",
            "period_start",
            "period_end",
            "gross_earnings",
            "swt",
            "super_employee_6pct",
            "super_employer_8_4pct",
            "net_pay",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row.employee.employee_id,
                row.employee.full_name,
                row.period_start,
                row.period_end,
                row.gross_earnings,
                row.swt,
                row.super_employee_6pct,
                row.super_employer_8_4pct,
                row.net_pay,
            ]
        )

    csv_bytes = buffer.getvalue().encode("utf-8")
    salt = os.urandom(16)
    token = _derive_fernet_from_password(password, salt).encrypt(csv_bytes)

    with open(output_path, "wb") as fp:
        fp.write(salt + token)
    return output_path

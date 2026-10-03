#!/usr/bin/env python3
"""Community Audit Synchronizer & Validation Tool.

Parses physical canteen audit CSV files collected during field operations,
performs local line-number validation before transmission, and uploads clean audit data
to the FoodBridge API via POST /api/audits/bulk using x-api-key authorization.

Usage:
    python3 audit_sync.py audit_log.csv            # Validate and upload to API
    python3 audit_sync.py audit_log.csv --dry-run  # Validate locally without uploading

Environment Variables:
    FOODBRIDGE_API_URL  API base URL (default: http://localhost:4000)
    AUDIT_API_KEY       Secret key for POST /api/audits/bulk
"""

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

REQUIRED_COLUMNS = [
    "audit_date",
    "location",
    "volunteer",
    "food_type",
    "weight_kg",
    "meals_served",
]
OPTIONAL_COLUMNS = ["notes"]


def read_csv_rows(csv_path):
    """Read CSV file and verify required columns exist."""
    if not os.path.exists(csv_path):
        sys.exit(f"Error: File not found at path '{csv_path}'")

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        missing = [col for col in REQUIRED_COLUMNS if col not in fieldnames]
        if missing:
            sys.exit(f"Error: CSV file missing required columns: {', '.join(missing)}")
        return list(reader)


def validate_audit_rows(rows):
    """Validate each row locally.

    Returns:
        (clean_rows, errors)
        Line numbers match physical CSV file line numbers (Header = Line 1, Data Starts = Line 2).
    """
    clean_rows = []
    errors = []

    for line_number, row in enumerate(rows, start=2):
        problems = []

        # 1. audit_date check (YYYY-MM-DD)
        audit_date_str = (row.get("audit_date") or "").strip()
        if not audit_date_str:
            problems.append("audit_date is required")
        else:
            try:
                datetime.strptime(audit_date_str, "%Y-%m-%d")
            except ValueError:
                problems.append("audit_date must be in YYYY-MM-DD format")

        # 2. Text fields non-empty
        for col in ("location", "volunteer", "food_type"):
            val = (row.get(col) or "").strip()
            if not val:
                problems.append(f"{col} cannot be empty")

        # 3. weight_kg non-negative float
        weight_str = (row.get("weight_kg") or "").strip()
        try:
            w = float(weight_str)
            if w < 0:
                problems.append("weight_kg must be a number >= 0")
        except ValueError:
            problems.append(f"weight_kg must be a valid number (got '{weight_str}')")

        # 4. meals_served non-negative integer
        meals_str = (row.get("meals_served") or "").strip()
        try:
            m = int(meals_str)
            if m < 0:
                problems.append("meals_served must be a whole number >= 0")
        except ValueError:
            problems.append(f"meals_served must be a valid integer (got '{meals_str}')")

        if problems:
            errors.append((line_number, problems))
        else:
            clean_record = {
                "audit_date": audit_date_str,
                "location": row["location"].strip(),
                "volunteer": row["volunteer"].strip(),
                "food_type": row["food_type"].strip(),
                "weight_kg": float(weight_str),
                "meals_served": int(meals_str),
                "notes": (row.get("notes") or "").strip() or None,
            }
            clean_rows.append(clean_record)

    return clean_rows, errors


def upload_audits(rows, api_url, api_key):
    """POST validated rows to /api/audits/bulk using x-api-key header."""
    endpoint = f"{api_url.rstrip('/')}/api/audits/bulk"
    payload = json.dumps({"rows": rows}).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        sys.exit(f"Server error ({e.code}) during bulk upload: {body}")
    except urllib.error.URLError as e:
        sys.exit(f"Failed to connect to FoodBridge API at {api_url}: {e.reason}")


def main():
    parser = argparse.ArgumentParser(
        description="Validate and upload canteen audit CSV files to FoodBridge API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("csv_path", help="Path to audit CSV log file")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate CSV locally without transmitting to the server",
    )
    args = parser.parse_args()

    print(f"Reading audit CSV: {args.csv_path}")
    raw_rows = read_csv_rows(args.csv_path)

    if not raw_rows:
        print("CSV file contains no data rows.")
        return

    clean_rows, errors = validate_audit_rows(raw_rows)

    if errors:
        print(f"\n[ERROR] Validation failed with {len(errors)} problem row(s):")
        for line_number, problems in errors:
            print(f"  line {line_number}: {'; '.join(problems)}")
        print("\nPlease fix the above lines in your spreadsheet before uploading.")
        sys.exit(1)

    print(f"[OK] Local validation passed: {len(clean_rows)} rows verified successfully.")

    if args.dry_run:
        print("[DRY-RUN] Dry-run mode enabled: Skipping network upload.")
        return

    api_url = os.environ.get("FOODBRIDGE_API_URL", "http://localhost:4000")
    api_key = os.environ.get("AUDIT_API_KEY")

    if not api_key:
        print("[WARNING] AUDIT_API_KEY environment variable is not set.")
        print("Run: export AUDIT_API_KEY=your_key (or set $env:AUDIT_API_KEY='key' in PowerShell)")
        sys.exit(1)

    print(f"Uploading audit batch to {api_url}/api/audits/bulk...")
    result = upload_audits(clean_rows, api_url, api_key)

    inserted = result.get("inserted", 0)
    skipped = result.get("skippedDuplicates", 0)
    received = result.get("received", len(clean_rows))

    print(f"[SUCCESS] Batch upload complete: {inserted} inserted, {skipped} duplicate(s) skipped (total received: {received}).")


if __name__ == "__main__":
    main()

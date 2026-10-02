#!/usr/bin/env python3
"""Validate a volunteer audit CSV and upload it to the FoodBridge API.

Usage:
    python3 audit_sync.py audit_log_template.csv            # validate and upload
    python3 audit_sync.py audit_log_template.csv --dry-run  # validate only

Reads FOODBRIDGE_API_URL and AUDIT_API_KEY from the environment.
Uses only the Python standard library.
"""
import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

REQUIRED = ["audit_date", "location", "volunteer", "food_type", "weight_kg", "meals_served"]
OPTIONAL = ["notes"]


def read_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED if c not in (reader.fieldnames or [])]
        if missing:
            sys.exit(f"CSV is missing columns: {', '.join(missing)}")
        return list(reader)


def validate(rows):
    """Return (clean_rows, errors). Line numbers match the spreadsheet (header = line 1)."""
    clean, errors = [], []
    for line, row in enumerate(rows, start=2):
        problems = []
        try:
            datetime.strptime(row["audit_date"].strip(), "%Y-%m-%d")
        except ValueError:
            problems.append("audit_date must be YYYY-MM-DD")
        for col in ("location", "volunteer", "food_type"):
            if not row[col].strip():
                problems.append(f"{col} is empty")
        try:
            if float(row["weight_kg"]) < 0:
                raise ValueError
        except ValueError:
            problems.append("weight_kg must be a number >= 0")
        try:
            if int(row["meals_served"]) < 0:
                raise ValueError
        except ValueError:
            problems.append("meals_served must be a whole number >= 0")

        if problems:
            errors.append((line, problems))
        else:
            clean.append({k: (row.get(k) or "").strip() for k in REQUIRED + OPTIONAL})
    return clean, errors


def upload(rows, api_url, api_key):
    req = urllib.request.Request(
        f"{api_url.rstrip('/')}/api/audits/bulk",
        data=json.dumps({"rows": rows}).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-api-key": api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"Server rejected the upload ({e.code}): {e.read().decode('utf-8', 'replace')}")
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach the API: {e.reason}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_path")
    parser.add_argument("--dry-run", action="store_true", help="validate without uploading")
    args = parser.parse_args()

    rows = read_rows(args.csv_path)
    clean, errors = validate(rows)

    if errors:
        print("Fix these rows and run again:")
        for line, problems in errors:
            print(f"  line {line}: {'; '.join(problems)}")
        sys.exit(1)

    print(f"{len(clean)} rows look good.")
    if args.dry_run:
        return

    api_url = os.environ.get("FOODBRIDGE_API_URL", "http://localhost:4000")
    api_key = os.environ.get("AUDIT_API_KEY")
    if not api_key:
        sys.exit("Set AUDIT_API_KEY before uploading.")

    result = upload(clean, api_url, api_key)
    print(f"Uploaded: {result['inserted']} new, {result['skippedDuplicates']} duplicates skipped.")


if __name__ == "__main__":
    main()

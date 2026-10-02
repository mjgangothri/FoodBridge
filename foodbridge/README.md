# FoodBridge: Surplus Food to Nearby People

**SDG 2 (Zero Hunger) and SDG 12 (Responsible Consumption).**
Restaurants, college canteens, hostels and events often have edible surplus
while people nearby need food. FoodBridge connects them before it spoils.

## The flow

```
Donor posts "30 meals available"  ->  Volunteer: Accept pickup
   ->  Volunteer: Mark collected  ->  NGO/community: Confirm food received
Dashboard:  Available -> Claimed -> Collected -> Distributed
```

**Expiry countdown** on every live listing:
🟢 2+ hours remaining, 🟡 1 to 2 hours, 🔴 under 1 hour (urgent pickup).
Unclaimed food disappears from the board once it expires.

**Impact line:** "This month, your campus diverted 420 meals from waste."

## Roles

| Role | Where | What they do |
|------|-------|--------------|
| Donor (restaurant, college, hostel, event) | `web-portal/` | Post surplus with a safe-until time |
| Volunteer | `web-portal/` | Accept pickup, mark collected |
| NGO / community | `web-portal/` | Confirm food received (marks Distributed) |
| Backend / data | `backend/` | REST API, PostgreSQL, guarded status transitions |
| Community audit | `community-audit/` | Volunteers upload CSV proof of deliveries |
| Side game | `game-client/` | Rescue Run mini-game; points are NOT real meals |

## Quick start

```bash
cp .env.example .env
npm run install:all
npm run db:init
npm run dev:backend   # :4000
npm run dev:portal    # :5174  (main app)
npm run dev:game      # :5173  (optional side game)
```

Open the portal in two browser windows, join as a donor in one and a
volunteer in the other, and walk a listing across the board.

## API

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/api/users` | any | Join as donor, volunteer or ngo |
| GET | `/api/listings` | any | Board data with `minutesLeft` and `urgency` |
| POST | `/api/listings` | donor | Post surplus |
| POST | `/api/listings/:id/claim` | volunteer | Accept pickup |
| POST | `/api/listings/:id/collect` | claiming volunteer | Mark collected |
| POST | `/api/listings/:id/distribute` | ngo | Confirm received |
| GET | `/api/impact/monthly?donorId=` | any | Meals diverted this month |
| GET | `/api/impact/summary` | any | Counts per stage |

Requests send `x-user-id` (demo auth).

## Known gaps (next steps)

- Auth is a demo header. Add real login (JWT/OAuth) and phone verification.
- No distance matching yet: add lat/lng on listings and "within 5 km" filtering.
- No push/SMS alerts for urgent (red) listings.
- Add food-safety fields (cooked time, allergens) and a donor rating system.
- Tests for status transitions and urgency thresholds.

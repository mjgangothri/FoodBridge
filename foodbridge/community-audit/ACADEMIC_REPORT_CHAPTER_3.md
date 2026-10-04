# Chapter 3: User Interface Ergonomics, Client-Side Expiry Synchronization, and Field Audit Verification

**Lead Role:** Member 3 (Web Portal & Field Audit Lead)  
**Target Subsystems:** `web-portal/src/*` & `community-audit/*`  
**Core Standard Alignment:** UN Sustainable Development Goals (SDG 2: Zero Hunger & SDG 12: Responsible Consumption and Production)

---

## 3.1 Chapter Abstract & Architectural Context

Food insecurity and food waste present dual systemic challenges in modern urban and campus environments. While commercial canteens, hostels, and event venues routinely produce edible surplus food, traditional redistribution pipelines suffer from severe operational friction, lack of real-time visibility, and inadequate verification mechanisms.

This chapter details the engineering design, implementation, and empirical evaluation of **FoodBridge's Front-End Portal and Field Audit Subsystem**, led by Member 3. The work encompasses three core technical contributions:
1. **Ergonomic Role-Based User Interface (`web-portal/src/dashboard.js`, `main.js`)**: A streamlined three-tap state transition workflow tailored for donors, volunteers, and NGO receivers operating in high-pressure kitchen environments.
2. **Client-Side Expiry Synchronization Engine (`web-portal/src/countdown.js`)**: A dual-tier timing architecture combining a 30-second local DOM re-render tick with a 60-second API polling tick, incorporating dynamic color-coded urgency thresholds and automatic item eviction at $T \le 0$.
3. **Field Audit Verification & Upload Tool (`community-audit/audit_sync.py`)**: A Python-based fieldwork synchronizer providing 1-based CSV line number validation, dry-run verification, and idempotent bulk transmission via `POST /api/audits/bulk` with `x-api-key` authentication.

---

## 3.2 User Interface Ergonomics & Role-Based Workflows (Task 3.1)

### 3.2.1 Operational Friction in Surplus Logistics
In active dining halls and commercial kitchens, staff face extreme time constraints. Complex multi-step web forms or traditional phone tree logistics lead to low adoption rates and abandoned food postings. To maximize adoption and operational velocity, the FoodBridge web portal adopts a **Three-Tap Workflow Model**:

```
[Tap 1: Donor View]           [Tap 2a: Volunteer View]        [Tap 2b: Volunteer View]        [Tap 3: NGO View]
Post Surplus Food Form  --->   Claim / Accept Pickup   --->   Mark Collected           --->   Confirm Received / Distribute
(meals >= 1, 15-1440m)         (status: available -> claimed) (status: claimed -> collected) (status: collected -> distributed)
```

### 3.2.2 Demo Authorization & State Machine Integration
Authentication during system demonstration is handled via the lightweight `x-user-id` HTTP request header, attached dynamically by `createApi()` in `web-portal/src/api.js`:

$$\text{Headers} = \{ \text{"Content-Type": "application/json"}, \text{"x-user-id": user.id} \}$$

The portal renders context-sensitive UI actions based on the active role persona (`donor`, `volunteer`, or `ngo`):
* **Donor View**: Exposes the surplus posting interface. Form fields enforce quantitative constraints: `meals` must be an integer $\ge 1$, and `expiresInMinutes` must fall strictly within $[15, 1440]$ minutes (15 minutes to 24 hours).
* **Volunteer View**: Displays available listings with a one-tap **"Claim / Accept pickup"** button. Upon claiming, ownership is assigned (`volunteer_id = user.id`) and the action dynamically updates to **"Mark Collected"**.
* **NGO View**: Displays collected items awaiting final community arrival, offering a one-tap **"Confirm Received / Distribute"** button.

---

## 3.3 Client-Side Expiry Synchronization & Real-Time Countdown Engine (Task 3.2)

### 3.3.1 Dual-Tier Timing Architecture
Relying solely on server polling for countdown timers causes noticeable visual lag and unnecessary network load. FoodBridge implements a **Dual-Tier Timing Architecture**:
1. **Local DOM Tick (30-second interval)**: Executes client-side timer recalculations using `web-portal/src/countdown.js` to update remaining time labels, urgency styling, and auto-hide expired listings locally without hitting the database.
2. **API Refresh Polling (60-second interval)**: Queries `GET /api/listings` to synchronize overall pipeline status, fetch newly posted listings, and clear items claimed by other users.

### 3.3.2 Urgency Threshold Formulation & Color Coding
The client-side countdown function `expiry(expiresAt, now)` computes the remaining duration $M = \lfloor (T_{\text{expires}} - T_{\text{now}}) / 60000 \rfloor$ and assigns visual urgency tiers:

$$\text{UrgencyTier}(M) = \begin{cases} 
\text{Expired (Auto-hidden)}, & M \le 0 \\
\text{Red (🔴 Urgent pickup: } t \text{ left)}, & 1 \le M < 60 \\
\text{Yellow (🟡 } t \text{ remaining)}, & 60 \le M < 120 \\
\text{Green (🟢 } t \text{ remaining)}, & M \ge 120 
\end{cases}$$

### 3.3.3 Automatic Local Eviction (Auto-Hide at T = 0)
When remaining time reaches zero ($M \le 0$), unclaimed listings in the `Available` column present a severe food safety risk. The `renderBoard()` method in `dashboard.js` automatically filters out expired available listings during local 30-second ticks.

---

## 3.4 Field Audit Verification & Data Pipeline Quality Control (Task 3.3)

### 3.4.1 3-Day Campus Canteen Surplus Weigh-In Fieldwork
A 3-day field audit was conducted across campus dining halls, canteens, and event spaces (September 28 – September 30, 2026). Volunteers recorded physical surplus weigh-ins using standardized CSV logs (`community-audit/canteen_audit_3day_log.csv`).

#### Summary Metrics:
- **Total Audited Locations:** 5 Campus Locations
- **Total Audit Logging Sessions:** 12 Batches
- **Total Surplus Weight:** 375.3 kg
- **Total Verified Meals:** 938 Meals

### 3.4.2 Audit Synchronizer Architecture (`audit_sync.py`)
The Python CLI utility `community-audit/audit_sync.py` processes physical audit logs using only Python standard libraries.
- 1-based CSV line error localization.
- `--dry-run` flag support.
- Idempotent API bulk ingestion via `POST /api/audits/bulk` with `x-api-key`.

---
*End of Chapter 3 Deliverable.*

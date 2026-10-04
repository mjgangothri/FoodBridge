import express from "express";
import cors from "cors";
import { attachUser, requireRole, createUser } from "./controllers/userController.js";
import {
  listListings, createListing, claimListing, collectListing,
  distributeListing, monthlyImpact, pipelineSummary,
} from "./controllers/listingController.js";
import { submitScore, getLeaderboard } from "./controllers/scoreController.js";
import { bulkInsertAudits, getAuditSummary, requireApiKey } from "./controllers/auditController.js";

const app = express();
const origins = (process.env.CORS_ORIGIN ?? "").split(",").filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json({ limit: "256kb" }));
app.use(attachUser);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- Core: surplus food pipeline (Available -> Claimed -> Collected -> Distributed) ---
app.post("/api/users", createUser);
app.get("/api/listings", listListings);
app.post("/api/listings", requireRole("donor"), createListing);
app.post("/api/listings/:id/claim", requireRole("volunteer"), claimListing);
app.post("/api/listings/:id/collect", requireRole("volunteer"), collectListing);
app.post("/api/listings/:id/distribute", requireRole("ngo"), distributeListing);
app.get("/api/impact/monthly", monthlyImpact);
app.get("/api/impact/summary", pipelineSummary);

// --- Community audit: independent verification of deliveries ---
app.post("/api/audits/bulk", requireApiKey, bulkInsertAudits);
app.get("/api/audits/summary", getAuditSummary);

// --- Side game: keeps people engaged; its scores are NOT counted as real meals ---
app.post("/api/scores", submitScore);
app.get("/api/scores/leaderboard", getLeaderboard);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`FoodBridge API listening on :${port}`));

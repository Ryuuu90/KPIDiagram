const express = require("express");
const { verifyFounder } = require("../middleware/auth.js");
const fc = require("../controllers/founderController.js");

const router = express.Router();

// ─── Client Management ────────────────────────────────────────────────────────
router.get("/clients",        verifyFounder, fc.getClients);
router.post("/clients",       verifyFounder, fc.createClient);
router.put("/clients/:id",    verifyFounder, fc.updateClient);
router.delete("/clients/:id", verifyFounder, fc.deleteClient);

// ─── Keycloak → DB sync webhook (no auth – verified by header secret) ─────────
router.post("/webhook/keycloak-delete", fc.handleKeycloakDeleteWebhook);

// ─── Data Model CRUD (founder-only) ──────────────────────────────────────────
router.get("/models/:model",          verifyFounder, fc.getModelDocuments);
router.put("/models/:model/:id",      verifyFounder, fc.updateModelDocument);
router.delete("/models/:model/:id",   verifyFounder, fc.deleteModelDocument);

module.exports = router;

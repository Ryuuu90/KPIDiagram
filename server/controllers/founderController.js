const Client = require("../models/Client");
const keycloakAdmin = require("../utils/keycloakAdmin");

// ─── Model registry ──────────────────────────────────────────────────────────
const BaseElements = require("../models/BaseElements.model");
const GlobalElements = require("../models/GlobalElements.model");
const Actif = require("../models/Actif");
const Passif = require("../models/Passif");
const CPC = require("../models/CPC");
const ESG = require("../models/ESG");

const MODEL_MAP = {
  baseelements: BaseElements,
  globalelements: GlobalElements,
  actif: Actif,
  passif: Passif,
  cpc: CPC,
  esg: ESG,
};

function resolveModel(name) {
  return MODEL_MAP[name?.toLowerCase()] || null;
}

// ─── Client Management ────────────────────────────────────────────────────────

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
};

const createClient = async (req, res) => {
  try {
    const { username, email, password, roles, companyName, department, firstName, lastName, isActive } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    // Prevent duplicate usernames in DB
    const existingClient = await Client.findOne({ username: username.toLowerCase().trim() });
    if (existingClient) {
      return res.status(400).json({ message: "A user with this username already exists." });
    }

    // 1. Create in Keycloak first
    let keycloakId;
    try {
      keycloakId = await keycloakAdmin.createKeycloakUser({
        username,
        email,
        password,
        roles,
        firstName,
        lastName,
        isActive,
      });
    } catch (kcError) {
      console.error("Keycloak create error:", kcError.message);
      return res.status(500).json({
        message: "Failed to create user in Keycloak. " + kcError.message,
      });
    }

    // 2. Create in MongoDB
    const newClient = await Client.create({
      keycloakId,
      username: username.toLowerCase().trim(),
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null,
      roles: roles || ["user"],
      companyName: companyName || null,
      department: department || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Failed to create client: " + error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    delete updateData._id;
    delete updateData.keycloakId;

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ message: "Failed to update client" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const clientToDelete = await Client.findById(id);
    if (!clientToDelete) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Delete from MongoDB first
    await Client.findByIdAndDelete(id);

    // Then remove from Keycloak (non-blocking – failure is logged, not thrown)
    keycloakAdmin.deleteKeycloakUser(clientToDelete.keycloakId).catch((err) =>
      console.error("Keycloak delete error (non-fatal):", err.message)
    );

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Failed to delete client" });
  }
};

const resetClientPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    if (!client.keycloakId) {
      return res.status(400).json({ message: "Client has no Keycloak ID associated." });
    }

    await keycloakAdmin.resetKeycloakUserPassword(client.keycloakId, password);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting client password:", error);
    res.status(500).json({ message: "Failed to reset client password: " + error.message });
  }
};

// ─── Keycloak Delete Webhook ──────────────────────────────────────────────────
// When a user is deleted directly in the Keycloak Admin Console, Keycloak
// can POST to this endpoint (via its Event Listener SPI / HTTP listener).
// We verify a shared secret header to prevent unauthorized calls.

const handleKeycloakDeleteWebhook = async (req, res) => {
  const secret = req.headers["x-webhook-secret"];
  if (secret !== process.env.KEYCLOAK_WEBHOOK_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { type, userId, realmId } = req.body;

  // Only act on DELETE_ACCOUNT or ADMIN_DELETE events
  if (type !== "DELETE_ACCOUNT" && type !== "ADMIN_DELETE" && !req.body.operationType?.includes("DELETE")) {
    return res.status(200).json({ message: "Event ignored" });
  }

  if (!userId) {
    return res.status(400).json({ message: "Missing userId in payload" });
  }

  try {
    const result = await Client.findOneAndDelete({ keycloakId: userId });
    if (result) {
      console.log(`Webhook: deleted DB user for Keycloak ID ${userId}`);
      return res.status(200).json({ message: "User deleted from DB" });
    } else {
      return res.status(200).json({ message: "User not found in DB (already gone or never synced)" });
    }
  } catch (err) {
    console.error("Webhook DB delete error:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

// ─── Model Document Management ────────────────────────────────────────────────

const getModelDocuments = async (req, res) => {
  try {
    const { model } = req.params;
    const Model = resolveModel(model);
    if (!Model) {
      return res.status(400).json({ message: `Unknown model: ${model}` });
    }

    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "50", 10);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Model.find({}).skip(skip).limit(limit).lean(),
      Model.countDocuments({}),
    ]);

    res.status(200).json({ docs, total, page, limit });
  } catch (error) {
    console.error("Error fetching model docs:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

const updateModelDocument = async (req, res) => {
  try {
    const { model, id } = req.params;
    const Model = resolveModel(model);
    if (!Model) {
      return res.status(400).json({ message: `Unknown model: ${model}` });
    }

    const updateData = req.body;
    delete updateData._id;
    delete updateData.__v;

    const updated = await Model.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating model doc:", error);
    res.status(500).json({ message: "Failed to update document" });
  }
};

const deleteModelDocument = async (req, res) => {
  try {
    const { model, id } = req.params;
    const Model = resolveModel(model);
    if (!Model) {
      return res.status(400).json({ message: `Unknown model: ${model}` });
    }

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting model doc:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
};

// ─── Send Reset Password Email ────────────────────────────────────────────────

const sendResetPasswordEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (!client.keycloakId || client.keycloakId.startsWith("temp_")) {
      return res.status(400).json({ message: "Client has no valid Keycloak account" });
    }

    await keycloakAdmin.sendKeycloakResetPasswordEmail(client.keycloakId);
    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Failed to send reset email: " + error.message });
  }
};

module.exports = {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  handleKeycloakDeleteWebhook,
  getModelDocuments,
  updateModelDocument,
  deleteModelDocument,
  resetClientPassword,
  sendResetPasswordEmail,
};

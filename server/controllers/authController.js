const Client = require("../models/Client");

const getProfile = async (req, res) => {
  try {
    let client = await Client.findOne({ keycloakId: req.user.sub });

    if (!client) {
      console.log("New user detected, auto-provisioning:", req.user.preferred_username || req.user.sub);
      // First login — auto-provision the user in MongoDB
      client = await Client.create({
        keycloakId: req.user.sub,
        username: req.user.preferred_username || req.user.sub.substring(0, 8),
        email: req.user.email || null,
        firstName: req.user.given_name || null,
        lastName: req.user.family_name || null,
        roles: req.user.realm_access?.roles || ["user"],
        isActive: true,
      });
      console.log("User created successfully in DB");
    }

    // Block deactivated accounts even if they hold a valid Keycloak token
    if (!client.isActive) {
      console.warn("User account is deactivated:", client.username);
      return res.status(403).json({
        message: "Compte désactivé. Contactez votre administrateur.",
      });
    }

    client.lastLogin = new Date();
    await client.save();

    res.status(200).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

module.exports = {
  getProfile,
};
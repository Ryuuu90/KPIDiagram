const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const Client = require("../models/Client");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "nhancit";

const client = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * ONLY verifies the JWT token from Keycloak.
 * Attaches the decoded token to req.user.
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    },
    (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.message);
        return res.status(401).json({ message: "Invalid token: " + err.message });
      }

      console.log("JWT Decoded Payload:", JSON.stringify(decoded, null, 2));
      req.user = decoded;
      next();
    }
  );
}

/**
 * Checks if the user exists in MongoDB and is active.
 * Requires verifyJWT to have run first.
 */
function requireActiveUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  Client.findOne({ keycloakId: req.user.sub })
    .then(dbUser => {
      if (!dbUser) {
        return res.status(401).json({ message: "User not found in local database" });
      }
      if (!dbUser.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }
      req.dbUser = dbUser;
      next();
    })
    .catch(err => {
      console.error("Error finding user in DB:", err);
      res.status(500).json({ message: "Internal server error during auth" });
    });
}

// verifyToken remains for backward compatibility, combining both checks
const verifyToken = [verifyJWT, requireActiveUser];

module.exports = {
  verifyJWT,
  requireActiveUser,
  verifyToken
};
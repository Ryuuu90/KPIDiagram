const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  keycloakId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  email: {
    type: String,
    default: null,
  },

  firstName: {
    type: String,
    default: null,
  },

  lastName: {
    type: String,
    default: null,
  },

  roles: {
    type: [String],
    default: ["user"],
  },

  companyName: {
    type: String,
    default: null,
  },

  department: {
    type: String,
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  lastLogin: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

clientSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.$set) {
    update.$set.updatedAt = new Date();
  } else {
    update.updatedAt = new Date();
  }

  next();
});

clientSchema.methods.toJSON = function () {
  const client = this.toObject();
  return client;
};

module.exports = mongoose.model("Client", clientSchema);
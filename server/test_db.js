const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log("SUCCESS: DB is connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILURE: DB connection error:", err.message);
    process.exit(1);
  });

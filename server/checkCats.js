const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const categories = await GlobalElements.distinct('Category');
  console.log("Distinct Categories:", categories);
  process.exit(0);
});

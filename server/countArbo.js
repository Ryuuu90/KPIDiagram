const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Arborescence = require('./models/Arborescence2.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const count = await Arborescence.countDocuments({});
  const nonNullCount = await Arborescence.countDocuments({ newSold: { $ne: null } });
  console.log(`Total count: ${count}, Non-null newSold: ${nonNullCount}`);
  process.exit(0);
});

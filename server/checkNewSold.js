const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Arborescence = require('./models/Arborescence2.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const list = await Arborescence.find({ newSold: { $ne: null } });
  console.log(`Found ${list.length} documents with non-null newSold.`);
  list.forEach(doc => {
    console.log(`${doc.parentId}: SoldeValue = ${doc.SoldeValue}, newSold = ${doc.newSold}`);
  });
  process.exit(0);
});

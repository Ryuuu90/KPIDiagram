const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Arborescence = require('./models/Arborescence2.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const all = await Arborescence.find({});
  console.log(`Total documents: ${all.length}`);
  
  // Find any document where SoldeValue is very large and newSold is very small
  const list = all.filter(doc => doc.SoldeValue > 1000000 && doc.newSold !== null && doc.newSold < 1000);
  console.log(`Found ${list.length} mismatched documents:`);
  list.forEach(doc => {
    console.log(`${doc.parentId} (${doc.nameFr}): SoldeValue = ${doc.SoldeValue}, newSold = ${doc.newSold}, formula = ${doc.formula}`);
  });
  
  process.exit(0);
});

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Arborescence = require('./models/Arborescence2.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  // Let's find calculated elements with null newSold
  const list = await Arborescence.find({ category: 'Elément calculé', newSold: null });
  console.log(`Found ${list.length} calculated elements with null newSold.`);
  list.slice(0, 20).forEach(doc => {
    console.log(`${doc.parentId}: formula = ${doc.formula}`);
  });
  process.exit(0);
});

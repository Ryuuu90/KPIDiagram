const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const rinds = await GlobalElements.find({ parentId: 'Rind' });
  console.log('Number of Rind documents:', rinds.length);
  rinds.forEach((r, i) => {
    console.log(`Rind ${i}: childrenIds =`, r.childrenIds);
  });
  process.exit(0);
});

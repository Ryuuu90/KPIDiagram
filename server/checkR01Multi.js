const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const r01s = await GlobalElements.find({ parentId: 'R01' });
  console.log('Number of R01 docs:', r01s.length);
  r01s.forEach((r, i) => {
    console.log(`R01 ${i}: childrenIds =`, r.childrenIds);
  });
  process.exit(0);
});

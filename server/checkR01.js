const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const r01 = await GlobalElements.findOne({ parentId: 'R01' });
  console.log('R01 document:', JSON.stringify(r01, null, 2));
  process.exit(0);
});

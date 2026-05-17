const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const r21 = await GlobalElements.findOne({ parentId: 'R21' });
  console.log('R21 childrenIds:', r21.childrenIds);
  process.exit(0);
});

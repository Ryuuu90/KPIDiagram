const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const ec079 = await GlobalElements.findOne({ parentId: 'EC079' });
  console.log('EC079:', JSON.stringify(ec079, null, 2));
  process.exit(0);
});

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const BaseElements = require('./models/BaseElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const ec079 = await BaseElements.findOne({ qui: 'EC079' });
  console.log('EC079 BaseElement:', JSON.stringify(ec079, null, 2));
  process.exit(0);
});

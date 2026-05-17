const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const rs = await GlobalElements.find({ parentId: { $in: ['R01', 'R02', 'R04', 'R05', 'R06', 'R07'] } });
  console.log('Found ratios:', rs.map(r => r.parentId));
  process.exit(0);
});

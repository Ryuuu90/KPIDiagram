const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const GlobalElements = require('./models/GlobalElements.model');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB. Fetching all GlobalElements...');
  const elements = await GlobalElements.find({});
  console.log(`Found ${elements.length} elements.`);

  let updatedCount = 0;
  for (const el of elements) {
    const formula = el.Formula || "";
    if (formula) {
      const matches = formula.match(/EC[A-Za-z0-9_]+|R[A-Za-z0-9_]+/gi) || [];
      const childrenIds = [...new Set(matches.map(id => id.toUpperCase()))];
      
      // Check if we need to update
      const existingStr = JSON.stringify(el.childrenIds || []);
      const newStr = JSON.stringify(childrenIds);
      if (existingStr !== newStr) {
        el.childrenIds = childrenIds;
        await el.save();
        console.log(`Updated ${el.parentId}: ${existingStr} -> ${newStr}`);
        updatedCount++;
      }
    }
  }

  console.log(`Finished updating! Updated ${updatedCount} elements.`);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

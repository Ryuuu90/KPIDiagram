const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const { getNodeById } = require('./controllers/nodesData');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const req = {
    params: { id: 'Rind' },
    body: { modulType: 'ratio', basesRef: {}, expandedNodes: [] },
    dbUser: { _id: '662b9f3d9b4b9e1a9b9b9b9b' }
  };
  const res = {
    status: (code) => {
      console.log('Status:', code);
      return {
        json: (data) => {
          require('fs').writeFileSync('output.json', JSON.stringify(data, null, 2));
          console.log('Saved to output.json');
          process.exit(0);
        }
      }
    }
  };

  try {
    await getNodeById(req, res);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
});

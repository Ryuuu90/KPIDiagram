const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Arborescence = require('./models/Arborescence2.model');

function isValidFormula(str) {
    return /^[0-9+\-*/().\s]+$/.test(str);
}

const getBaseElments = (elementId, arb, visited = new Set()) =>{
    const results = [];
    if(visited.has(elementId))
        return results;
    visited.add(elementId);
    const parent = arb.find(ele => ele.parentId === elementId);
    if(!parent || !parent.childrenIds) 
        return results;
    for( let childId of parent.childrenIds.map(id => id.trim()))
    {
        const child = arb.find(ele => ele.parentId === childId);
        if(!child)
            continue;
        if(child.category === 'Elément de base')
            results.push(childId);
        else
            results.push(...getBaseElments(childId, arb, visited));
    }
    return results;
}

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  // Let's simulate the controller logic for a dummy user (or find first user)
  const firstArbo = await Arborescence.findOne({});
  if (!firstArbo) {
    console.log('No arborescence documents found!');
    process.exit(1);
  }
  const clientId = firstArbo.clientId;
  console.log('Simulating for clientId:', clientId);

  let arb = await Arborescence.find({ clientId });
  let length = arb.length;
  arb = arb.map(elem => elem.toObject());

  // Dummy basesRef (empty or with some key)
  const basesRef = {};

  let affected = {'EC048' : null, 'EC157' : null, 'EC158' : null, 'EC156' : null, 'EC159' : null,
       'EC160' : null, 'EC073' : null, 'EC043' : null, 'EC061' : null, 'EC031' : null, 'EC020' : null};
  let influencers = ['EC041', 'EC074', 'EC113', 'EC078', 'EC080']
  let infAndAff = {'EC041' : 'EC157', 'EC074' : 'EC158', 'EC113' : 'EC156', 'EC078': 'EC159', 'EC080' : 'EC160'}

  arb = arb.map(elem => {
      let newSold = null;
      return {
          ...elem,
          newSold,
      }
  });

  let update = true;
  let iterations = 0;
  while(update && iterations < 20)
  {
      iterations++;
      update = false;
      let calculatedThisIteration = 0;
      let invalidThisIteration = 0;

      for(let i = 0; i < length; i++)
      {   
          if(arb[i].eleType === 'Source')
              continue;
          const formula = arb[i].formula;
          if (!formula || typeof formula !== 'string')
              continue;
          let evaluatedFormula = formula.replace(/EC\d+|R\d{2}/g, match => {
              const found = arb.find(elem => elem.parentId.trim() === match.trim());
              if (found && found.newSold !== null) {
                  return found.newSold;
              }
              else if  (found && found.newSold === null &&( getBaseElments(found.parentId, arb).includes(...Object.keys(basesRef))) && found.category !== 'Elément de base')
              {
                  return match; 
              }
              else if(found && found.newSold === null  && found.SoldeValue !== undefined)
              {
                  return found.SoldeValue;
              }
              return match;  
          });
          evaluatedFormula = evaluatedFormula.replace(/N-1/g, " * 0").replace(/j|N|J/g, " * 1");
          
          let safeFormula = evaluatedFormula
          .replace(/--/g, '+')
          .replace(/\+\s*-/g, '-')
          .replace(/-\s*-/g, '+')
          .replace(/\+\s*\+/g, '+')
          .replace(/,/, '.');
          
          if(isValidFormula(safeFormula))
          {
              arb[i].newSold = eval(safeFormula).toFixed(2);
              calculatedThisIteration++;
          }
          else
          {
              invalidThisIteration++;
              update = true;
          }
      }
      console.log(`Iteration ${iterations}: Calculated: ${calculatedThisIteration}, Invalid: ${invalidThisIteration}, update: ${update}`);
  }

  process.exit(0);
});

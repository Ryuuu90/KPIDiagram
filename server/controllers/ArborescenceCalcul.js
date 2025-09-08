const Arborescence = require('../models/Arborescence2.model');
const xlsx = require('xlsx');
const path = require('path')


function isValidFormula(str) {
    // Allowed chars: digits, spaces, + - * / ( ) .
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
        const child = arb.find(ele => ele.parentId === elementId);
        if(!child)
            continue;
        if(child.category === 'Elément de base')
            results.push(childId);
        else
            results.push(...getBaseElments(childId, arb, visited));
    }
    return results;

}
exports.ArborescenceCalcul = async (req, res) =>{
    try{
        const {basesRef, expandedNodes} = req.body;
        // console.log(basesRef);
        // Object.entries(basesRef).forEach(([key, value] )=> console.log(key));
        // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Arborescence2.xlsx'));
        // let sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // sheet = sheet.filter(row=> row['NumEC'])
        // const elemBase = sheet.map(row => row['NumEC']);
        // console.log(elemBase);
        // console.log(Object.keys(basesRef));
        let arb = await Arborescence.find();
        let length = arb.length;
        atb = arb.map(elem => elem = elem.toObject());
        // console.log(getBaseElments('EC127', arb));
        arb = arb.map(elem => {
            elem = elem.toObject();
            const found =  Object.entries(basesRef).find(([key, value] ) => key === elem.parentId)
            let newSold;
            if(found && elem.category !== "Elément calculé" && found[1] !== null && found[1] !== "")
            {
                // console.log(found['SoldeValue']);
                // if(typeof(found['SoldeValue']) !== 'number')
                //     SoldeValue = 0;
                // else
                //     SoldeValue = found['SoldeValue'];
                newSold = found[1];
                // console.log(elem.parentId, "--->" , found, "--->" , newSold);

            }
            else
                newSold =  null;
            
            return{
                ...elem,
                // SoldeValue,
                newSold,
            }
        })
        let update = true
        while(update)
        {
            update = false
            for(let i = 0; i < length; i++)
            {   
                if(arb[i].eleType === 'Source')
                    continue;
                const formula = arb[i].formula;
                let evaluatedFormula = formula.replace(/EC\d+|R\d{2}/g, match => {
                    const found = arb.find(elem => elem.parentId.trim() === match.trim());
                    // console.log(getBaseElments(found.parentId));
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
                    return match;  // return original ECxxx if no value found
                });
                evaluatedFormula = evaluatedFormula.replace(/N-1/g, " * 0").replace(/j|N|J/g, " * 1");
                
                let safeFormula = evaluatedFormula
                .replace(/--/g, '+')         // replace double minus
                .replace(/\+\s*-/g, '-')     // + - → -
                .replace(/-\s*-/g, '+')      // - - → +
                .replace(/\+\s*\+/g, '+')
                .replace(/,/, '.');   // + + → +
                
                if(isValidFormula(safeFormula))
                {
                    // console.log(evaluatedFormula);
                    arb[i].newSold = eval(safeFormula).toFixed(2);
                    // console.log(arb[i].parentId, "--->" , safeFormula, "--->" , arb[i].newSold);
                }
                else
                {
                    console.log(arb[i].parentId , ":", arb[i].nameFr ," : ", evaluatedFormula);
                    update = true;
                }
                // console.log(i, arb[i].parentId, ":" , safeFormula);
            }
        }
        const operations = arb
        .filter(doc => 
            doc.eleType !== 'Source' && 
            doc._id 
        )
        .map(doc => ({
            updateOne: {
            filter: { _id: doc._id },
            update: { $set :doc }
            }
        }));
        

        if (operations.length > 0) {
             await Arborescence.bulkWrite(operations);
        } else {
        console.log('No valid operations to perform.');
        }
        res.status(200).json({success : true , message : 'calculation are done'});

    }
    catch(error)
    {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}
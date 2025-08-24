const Arborescence = require('../models/Arborescence2.model');
const xlsx = require('xlsx');
const path = require('path')


function isValidFormula(str) {
    // Allowed chars: digits, spaces, + - * / ( ) .
    return /^[0-9+\-*/().\s]+$/.test(str);
  }
exports.ArborescenceCalcul = async () =>{
    try{
        const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Arborescence2.xlsx'));
        let sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        sheet = sheet.filter(row=> row['NumEC'])
        const elemBase = sheet.map(row => row['NumEC']);
        let arb = await Arborescence.find();
        let length = arb.length;
        atb = arb.map(elem => elem = elem.toObject());
        // console.log(arb);
        arb = arb.map(elem => {
            elem = elem.toObject();
            const found = sheet.find(row => row['NumEC'] === elem.parentId)
            let SoldeValue
            if(found && elem.category !== "Elément calculé")
            {
                // console.log(found['SoldeValue']);
                if(typeof(found['SoldeValue']) !== 'number')
                    SoldeValue = 0;
                else
                    SoldeValue = found['SoldeValue'];
            }
            else
                SoldeValue =  undefined;
            
            return{
                ...elem,
                SoldeValue,
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
                    // console.log()
                    if (found && found.SoldeValue !== undefined) {
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
                    arb[i].SoldeValue = eval(safeFormula).toFixed(2);
                    // console.log(i, arb[i].parentId, "-->" , safeFormula, "--->" , arb[i].SoldeValue);

                }
                else
                {
                    // console.log(i ," : ", evaluatedFormula);
                    update = true;
                }
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

    }
    catch(error)
    {
        throw(error);
    }
}
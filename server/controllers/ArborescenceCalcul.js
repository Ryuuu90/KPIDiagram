const Arborescence = require('../models/Arborescence2.model');
const xlsx = require('xlsx');
const path = require('path');
const { Console } = require('console');


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
        const {basesRef, expandedNodes, calculResultsRef} = req.body;
        console.log(calculResultsRef);
        // console.log(basesRef);
        // Object.entries(basesRef).forEach(([key, value] )=> console.log(key));
        // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Arborescence2.xlsx'));
        // let sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // sheet = sheet.filter(row=> row['NumEC'])
        // const elemBase = sheet.map(row => row['NumEC']);
        // console.log(basesRef);
        // console.log(Object.keys(basesRef));
        let arb = await Arborescence.find();
        let length = arb.length;
        atb = arb.map(elem => elem = elem.toObject());
        let affected = {'EC048' : null, 'EC157' : null, 'EC158' : null, 'EC156' : null, 'EC159' : null,
             'EC160' : null, 'EC073' : null, 'EC043' : null, 'EC061' : null, 'EC031' : null, 'EC020' : null};
        // console.log(getBaseElments('EC127', arb));
        let influencers = ['EC041', 'EC074', 'EC113', 'EC078', 'EC080']
        let infAndAff = {'EC041' : 'EC157', 'EC074' : 'EC158', 'EC113' : 'EC156', 'EC078': 'EC159', 'EC080' : 'EC160'}

        arb = arb.map(elem => {
            elem = elem.toObject();
            const found =  Object.entries(basesRef).find(([key, value] ) => key === elem.parentId)
            let newSold;
            if(found && elem.category !== "Elément calculé" && found[1] !== null && found[1] !== "")
            {
                // console.log(found['SoldeValue']);
                // if(typeof(found['SoldeValue']) !== 'number')
                newSold = Number(found[1]);

                if(influencers.includes(elem.parentId))
                {
                    const divNum = elem.parentId === 'EC041' ? 20 : elem.parentId === 'EC074' ? 10 : 5
                    const amortissement = infAndAff[elem.parentId];
                    const EC139 = arb.find(elem => elem.parentId === 'EC139').SoldeValue;
                    const EC090 = arb.find(elem => elem.parentId === 'EC090').SoldeValue;
                    const dot = elem.parentId === 'EC113'? 0 : ( newSold - elem.SoldeValue) / divNum;
                    affected['EC048'] = arb.find(elem => elem.parentId === 'EC048');
                    affected['EC048'].newSold =  affected['EC048'].SoldeValue + dot
                    affected[amortissement] = arb.find(elem => elem.parentId === amortissement);
                    affected[amortissement].newSold = affected[amortissement].SoldeValue + dot;
                    if(!affected['EC073'])
                        affected['EC073'] = arb.find(elem => elem.parentId === 'EC073');
                    affected['EC073'].newSold = (affected['EC073'].SoldeValue / EC139) * (EC139 - affected['EC048'].newSold) < 0 ? (0.25 / 100) * EC090  : (affected['EC073'].SoldeValue / EC139) * (EC139 - affected['EC048'].newSold);
                }
                if(elem.parentId === 'EC090')
                {
                    affected['EC043'] = arb.find(elem=> elem.parentId === 'EC043');
                    affected['EC043'].newSold = affected['EC043'].SoldeValue * newSold / elem.SoldeValue;
                }
                if(elem.parentId === 'EC004' || elem.parentId === 'EC008')
                {
                    const otherElem = elem.parentId === 'EC004' ?  arb.find(elem => elem.parentId === 'EC008') : arb.find(elem => elem.parentId === 'EC004');
                    const otherElemNewSold =  otherElem.newSold === null ? otherElem.SoldeValue : otherElem.newSold;
                    affected['EC061'] = arb.find(elem=> elem.parentId === 'EC061');
                    affected['EC061'].newSold = affected['EC061'].SoldeValue * ((newSold + otherElemNewSold)/ (elem.SoldeValue + otherElem.SoldeValue));
                }
                if(elem.parentId === 'EC054' || elem.parentId === 'EC013' && calculResultsRef)
                {
                    affected['EC031'] = arb.find(elem => elem.parentId === 'EC031');
                    affected['EC020'] = arb.find(elem => elem.parentId === 'EC020');
                    const EC139 = arb.find(elem => elem.parentId === 'EC139').SoldeValue;
                    const EC090 = arb.find(elem => elem.parentId === 'EC090').SoldeValue;
                    if(!affected['EC073'])
                        affected['EC073'] = arb.find(elem => elem.parentId === 'EC073');
                    affected['EC073'].newSold = (affected['EC073'].SoldeValue / EC139) * (EC139 - calculResultsRef.firstYearIntrest) < 0 ? (0.25 / 100) * EC090  : (affected['EC073'].SoldeValue / EC139) * (EC139 - calculResultsRef.firstYearIntrest);
                    affected['EC031'].newSold = affected['EC031'].SoldeValue + calculResultsRef.firstYearIntrest;
                    affected['EC020'].newSold = affected['EC020'].SoldeValue + calculResultsRef.amount - calculResultsRef.firstYearPayment - ( affected['EC073'].SoldeValue -  affected['EC073'].newSold);


                }

            }
            else
                newSold =  null;
            
            return{
                ...elem,
                // SoldeValue,
                newSold,
            }
        })
        arb = arb.map(elem => {
            if(Object.keys(affected).includes(elem.parentId) && affected[elem.parentId])
                return affected[elem.parentId];
            return elem;
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
                    if(evaluatedFormula.includes("Infinity"))
                        return res.status(422).json({success : false, message : "La valeur de cet élément ne doit pas être 0 dans ce cas."})
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
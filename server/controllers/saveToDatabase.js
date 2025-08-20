const Arborescence = require('../models/Arborescence.model');
const xlsx = require('xlsx');
const path = require('path')

exports.saveToDatabase  = async (req, res) =>{

    try {
        const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Arborescence2.xlsx'));
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]]);
        const parentMap = {}
        for (row of sheet)
        {
            // console.log(row);
            const parentId = row["NumParent"];
            const parentName = row["Parent"];
            const level = row["Niveau"];
            const reportName = row["Nom du rapport"];
            const childId = row["NumChildren"];
            const childName = row["Children"];

            if(!parentMap[parentId])
            {
                parentMap[parentId] ={
                    reportName,
                    parentId,
                    parentName,
                    level,
                    childrenIds : new Set(),
                    childrenData : new Object()
                }
            }
            if(childId)
            {
                parentMap[parentId].childrenIds.add(childId);
                parentMap[parentId].childrenData[childId] = childName;
            }
        }
        const records = Object.values(parentMap).map(entry => ({
            ...entry,
            childrenIds : Array.from(entry.childrenIds)
        }))
        console.log(records);
        for (rec of records)
        {
            await Arborescence.updateOne({parentId : rec.parentId}, {$set : rec}, {upsert : true});
        }
        res.status(200).json({success : true, message : 'successfully'});
    }
    catch(error)
    {
        res.status(500).json({success : false, message : 'error', error : error.message});
        
    }
}
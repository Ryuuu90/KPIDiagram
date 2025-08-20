const Arborescence = require('../models/Arborescence2.model');
const xlsx = require('xlsx');
const path = require('path')

exports.saveToDatabase2  = async (req, res) =>{

    try {
        const workbook = xlsx.readFile(path.join(__dirname, '../public', 'Arborescence2.xlsx'));
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[8]]);
        const parentMap = {};
        // console.log(sheet);
        for(row of sheet)
        {
            const parentId = row["ID"];
            const formula = row["Méthode de calcul Numérique"];
            const method = row["Méthode de calcul"];
            const category = row["Catégorie"];
            const typology = row["Typologie"];
            const eleType = row["ElementType"];
            const nameFr = row["NomFr"];
            const nameAn = row["NomAn"];
            const nameAr = row["NomAr"];
            const signification = row["Signification"] ? row["Signification"] : "none";
            const interpretation = row["Interprétation"] ? row["Interprétation"] : "none";
            const recommandations = row["Recommandations"] ? row["Recommandations"] : "none";
            const example = row["Exemple"] ? row["Exemple"] : "none";
            const Reports = row["Rapports"];
            const newSold = null;

            let childrenIds = [];
            if(eleType === 'EC')
            {
                const parsed = formula.split(/([+-])/);
                for (let i = 0; i < parsed.length ; i++)
                {
                    if(i === 0 && !(parsed[i] === '+' || parsed[i] === '-'))
                        childrenIds.push(parsed[i]);
                    else if(parsed[i] === '+' || parsed[i] === '-')
                    {
                        childrenIds.push(`${parsed[i]} ${parsed[i + 1]}`)
                        i++;
                    }
                }
            }
            else if(eleType === 'Ratio')
                childrenIds = [...new Set(formula.match(/EC\d+|R\d{2}/g) || [])];
            else
                childrenIds = formula.split(/[.]/);
            if(!parentMap[parentId])
            {
                parentMap[parentId] = {
                    parentId,
                    category,
                    childrenIds,
                    formula,
                    typology,
                    eleType,
                    nameFr,
                    nameAn,
                    nameAr,
                    signification,
                    interpretation,
                    recommandations,
                    example,
                    method,
                    Reports,
                    newSold,
                }
            }

            // if(parentMap[r])
            // return
        }
        const records = Object.values(parentMap);
        const operations = records.map(rec => ({
            updateOne: {
              filter: { parentId: rec.parentId },
              update: { $set: rec },
              upsert: true
            }
          }));
        await Arborescence.bulkWrite(operations);
        
        res.status(200).json({success : true, message : 'successfully'});
    }
    catch(error)
    {
        res.status(500).json({success : false, message : 'error', error : error.message});
        
    }
}
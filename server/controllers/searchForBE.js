const Arborescence = require('../models/Arborescence2.model');
const xlsx = require('xlsx');
const path = require('path')

const getBaseElments = (elementId, parentMap, visited = new Set()) =>{
    const results = [];
    if(visited.has(elementId))
        return results;
    visited.add(elementId);
    const parent = parentMap[elementId];
    if(!parent || !parent.childrenIds) 
        return results;
    for( let childId of parent.childrenIds.map(id => id.trim()))
    {
        const child = parentMap[childId];
        if(!child)
            continue;
        if(child.category === 'Elément de base')
            results.push(childId);
        else
            results.push(...getBaseElments(childId, parentMap, visited));
    }
    return results;

}

exports.searchForBE  = async (req, res) =>{

    try {

        const {elementId} = req.body;
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
                const parsed = formula.split(/[+-]/);
                childrenIds.push(...parsed);
                // console.log(childrenIds);
            }
            else if(eleType === 'Ratio')
                childrenIds = [...new Set(formula.match(/EC\d+|R\d{2}/g) || [])];
            else
                childrenIds = formula.split(/[.]/);
            if(!parentMap[parentId])
            {
                parentMap[parentId] = {
                    childrenIds,
                    category,
                }
            }

            // if(parentMap[r])
            // return
        }
        // const records = Object.values(parentMap); 
        const children = getBaseElments(elementId, parentMap);
        // console.log(children);
        
        const elements = await Arborescence.find({parentId : {$in : children}});
        // console.log(elements);

        res.status(200).json({success : true, message : 'successfully', elements : elements});
    }
    catch(error)
    {
        res.status(500).json({success : false, message : 'error', error : error.message});
        
    }
}
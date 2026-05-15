const Arborescence = require('../models/Arborescence2.model');
const GlobalElements = require('../models/GlobalElements.model');
const BaseElements = require('../models/BaseElements.model');
const xlsx = require('xlsx');

function isValidFormula(str) {
    // Allowed chars: digits, spaces, + - * / ( ) .
    return /^[0-9+\-*/().\s]+$/.test(str);
}

const getBaseElments = (elementId, arb, visited = new Set()) => {
    const results = [];
    if (visited.has(elementId))
        return results;
    visited.add(elementId);
    const parent = arb.find(ele => ele.parentId === elementId);
    if (!parent || !parent.childrenIds)
        return results;
    for (let childId of parent.childrenIds.map(id => id.trim())) {
        const child = arb.find(ele => ele.parentId === childId);
        if (!child)
            continue;
        if (child.category === 'Elément de base')
            results.push(childId);
        else
            results.push(...getBaseElments(childId, arb, visited));
    }
    return results;
}

exports.uploadArborescence = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Parse the Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        // 0. Validate Base Elements structure (Sheet 1)
        const baseSheetName = workbook.SheetNames[0];
        if (!baseSheetName) {
            return res.status(400).json({ success: false, message: 'validation.missing_sheet' });
        }
        const baseSheetData = xlsx.utils.sheet_to_json(workbook.Sheets[baseSheetName], { header: 1 });
        const masterBaseElements = await BaseElements.find({});
        const masterMap = new Map(masterBaseElements.map(b => [b.Name, b]));

        // Parse the uploaded sheet into a structured map
        const uploadedMap = new Map();
        let lastParentId = null;

        for (let i = 0; i < baseSheetData.length; i++) {
            const row = baseSheetData[i];
            const numEc = row[0];
            const qui2 = row[2];
            const label = row[3];

            if (numEc && typeof numEc === 'string' && numEc.startsWith('EC')) {
                lastParentId = numEc;
                uploadedMap.set(numEc, { Label: label, Children: [] });
            } else if (qui2 && lastParentId) {
                uploadedMap.get(lastParentId).Children.push({ id: String(qui2), Label: label });
            }
        }

        // 0.1 Check for unknown parents or mismatched labels
        for (const [id, data] of uploadedMap) {
            const master = masterMap.get(id);
            if (!master) {
                return res.status(400).json({ success: false, message: 'validation.unknown_parent', params: { id } });
            }
            if (master.Label !== data.Label) {
                return res.status(400).json({ success: false, message: 'validation.mismatched_label', params: { id, expected: master.Label, found: data.Label } });
            }

            // 0.2 Check for exact children (no more, no less)
            const masterIds = master.Children.map(c => String(c.id));
            const uploadedIds = data.Children.map(c => String(c.id));

            // Find missing children (in master but not in uploaded)
            const missingChildId = masterIds.find(id => !uploadedIds.includes(id));
            if (missingChildId) {
                return res.status(400).json({ success: false, message: 'validation.missing_child_account', params: { parentId: id, childId: missingChildId } });
            }

            // Find extra children (in uploaded but not in master)
            const extraChildId = uploadedIds.find(id => !masterIds.includes(id));
            if (extraChildId) {
                return res.status(400).json({ success: false, message: 'validation.extra_child_account', params: { parentId: id, childId: extraChildId } });
            }

            // 0.3 Verify child labels
            for (const child of data.Children) {
                const masterChild = master.Children.find(c => String(c.id) === child.id);
                if (masterChild && masterChild.Label !== child.Label) {
                    return res.status(400).json({ success: false, message: 'validation.mismatched_child_label', params: { id: child.id, parentId: id, expected: masterChild.Label, found: child.Label } });
                }
            }
        }

        // 0.4 Check if any master elements are missing in the upload
        for (const [id] of masterMap) {
            if (!uploadedMap.has(id)) {
                return res.status(400).json({ success: false, message: 'validation.missing_parent_element', params: { id } });
            }
        }

        // 1. Parse the main Arborescence sheet (usually sheet 9)
        const sheetName = workbook.SheetNames[8]; 
        if (!sheetName) {
            return res.status(400).json({ success: false, message: 'Invalid Excel structure: Expected at least 9 sheets' });
        }
        const arboSheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 2. Parse the balances sheet ('base-EC-values')
        const valuesSheetRaw = workbook.Sheets['Base-EC-Values'];


        const balanceMap = {};
        if (valuesSheetRaw) {
            const valuesData = xlsx.utils.sheet_to_json(valuesSheetRaw);
            console.log("valuesSheetRaw", valuesData);
            valuesData.forEach(row => {
                const id = row["ID"] || row["id"] || row["NumEC"] || row["numec"];
                const val = row["SoldeValue"] || row["solde"] || row["Value"] || row["Valeur"];
                if (id) balanceMap[id] = Number(val) || 0;
            });
        }

        const parentMap = {};

        for (const row of arboSheet) {
            const parentId = row["ID"];
            // ... (rest of parsing)
            const formula = row["Méthode de calcul Numérique"] || "";
            const method = row["Méthode de calcul"];
            const category = row["Catégorie"];
            const typology = row["Typologie"];
            const eleType = row["ElementType"];
            const nameFr = row["NomFr"];
            const nameAn = row["NomAn"];
            const nameAr = row["NomAr"];
            const signification = row["Signification"] || "none";
            const interpretation = row["Interprétation"] || "none";
            const recommandations = row["Recommandations"] || "none";
            const example = row["Exemple"] || "none";
            const Reports = row["Rapports"] || "none";
            
            // Priority: Value from 'base-EC-values' sheet, then column in main sheet, then 0
            const SoldeValue = balanceMap[parentId] !== undefined 
                ? balanceMap[parentId] 
                : (Number(row["SoldeValue"]) || 0);
            console.log("SoldeValue", SoldeValue);

            let childrenIds = [];
            if (eleType === 'EC') {
                childrenIds = formula.split(/[+-]/).map(id => id.trim()).filter(id => id);
            } else if (eleType === 'Ratio') {
                childrenIds = [...new Set(formula.match(/EC\d+|R\d{2}/g) || [])];
            } else if (formula) {
                childrenIds = formula.split(/[.]/).map(id => id.trim()).filter(id => id);
            }

            if (!parentMap[parentId]) {
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
                    newSold: null,
                    SoldeValue,
                    clientId: req.dbUser._id
                }
            }
        }

        let records = Object.values(parentMap);
        const length = records.length;
        
        let affected = {
            'EC048': null, 'EC157': null, 'EC158': null, 'EC156': null, 'EC159': null,
            'EC160': null, 'EC073': null, 'EC043': null, 'EC061': null, 'EC031': null, 'EC020': null
        };
        let influencers = ['EC041', 'EC074', 'EC113', 'EC078', 'EC080'];
        let infAndAff = { 'EC041': 'EC157', 'EC074': 'EC158', 'EC113': 'EC156', 'EC078': 'EC159', 'EC080': 'EC160' };

        // Apply special logic similar to ArborescenceCalcul
        records = records.map(elem => {
            const foundVal = balanceMap[elem.parentId];
            if (foundVal !== undefined && elem.category !== "Elément calculé") {
                const newSold = Number(foundVal);
                if (influencers.includes(elem.parentId)) {
                    const divNum = elem.parentId === 'EC041' ? 20 : elem.parentId === 'EC074' ? 10 : 5;
                    const amortissement = infAndAff[elem.parentId];
                    const EC139 = records.find(e => e.parentId === 'EC139')?.SoldeValue || 0;
                    const EC090 = records.find(e => e.parentId === 'EC090')?.SoldeValue || 0;
                    const dot = elem.parentId === 'EC113' ? 0 : (newSold - elem.SoldeValue) / divNum;
                    
                    affected['EC048'] = records.find(e => e.parentId === 'EC048');
                    if (affected['EC048']) affected['EC048'].SoldeValue += dot;
                    
                    affected[amortissement] = records.find(e => e.parentId === amortissement);
                    if (affected[amortissement]) affected[amortissement].SoldeValue += dot;
                    
                    if (!affected['EC073']) affected['EC073'] = records.find(e => e.parentId === 'EC073');
                    if (affected['EC073'] && EC139 !== 0) {
                        affected['EC073'].SoldeValue = (affected['EC073'].SoldeValue / EC139) * (EC139 - (affected['EC048'] ? affected['EC048'].SoldeValue : 0)) < 0 
                            ? (0.25 / 100) * EC090 
                            : (affected['EC073'].SoldeValue / EC139) * (EC139 - (affected['EC048'] ? affected['EC048'].SoldeValue : 0));
                    }
                }
                if (elem.parentId === 'EC090' && elem.SoldeValue !== 0) {
                    affected['EC043'] = records.find(e => e.parentId === 'EC043');
                    if (affected['EC043']) affected['EC043'].SoldeValue = affected['EC043'].SoldeValue * newSold / elem.SoldeValue;
                }
                if ((elem.parentId === 'EC004' || elem.parentId === 'EC008')) {
                    const otherElem = elem.parentId === 'EC004' ? records.find(e => e.parentId === 'EC008') : records.find(e => e.parentId === 'EC004');
                    if (otherElem) {
                        const totalOld = elem.SoldeValue + otherElem.SoldeValue;
                        if (totalOld !== 0) {
                            affected['EC061'] = records.find(e => e.parentId === 'EC061');
                            if (affected['EC061']) affected['EC061'].SoldeValue = affected['EC061'].SoldeValue * ((newSold + otherElem.SoldeValue) / totalOld);
                        }
                    }
                }
                elem.SoldeValue = newSold;
            }
            return elem;
        });

        // Iterative calculation loop
        let update = true;
        let iterations = 0;
        const maxIterations = 100; // Safety break
        while (update && iterations < maxIterations) {
            update = false;
            iterations++;
            for (let i = 0; i < length; i++) {
                if (records[i].eleType === 'Source' || records[i].category === 'Elément de base' || !records[i].formula)
                    continue;

                const formula = records[i].formula;
                let evaluatedFormula = formula.replace(/EC\d+|R\d{2}/g, match => {
                    const found = records.find(elem => elem.parentId.trim() === match.trim());
                    if (found && found.SoldeValue !== undefined) {
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

                if (isValidFormula(safeFormula)) {
                    try {
                        const result = eval(safeFormula);
                        const newVal = parseFloat(result.toFixed(2));
                        if (records[i].SoldeValue !== newVal) {
                            records[i].SoldeValue = newVal;
                            update = true;
                        }
                    } catch (e) {
                        // If eval fails, it might still have ECxxx tags, skip and try next iteration
                    }
                } else {
                    // Formula not yet fully resolved
                }
            }
        }

        const globalOperations = records.map(rec => ({
            updateOne: {
                filter: { parentId: rec.parentId },
                update: { $set: {
                    parentId: rec.parentId,
                    childrenIds: rec.childrenIds,
                    Formula: rec.formula,
                    Method: rec.method,
                    Category: rec.category,
                    Typology: rec.typology,
                    EleType: rec.eleType,
                    NameFr: rec.nameFr,
                    NameAn: rec.nameAn,
                    NameAr: rec.nameAr,
                    Signification: rec.signification,
                    Interpretation: rec.interpretation,
                    Recommandations: rec.recommandations,
                    Example: rec.example,
                    Reports: rec.Reports
                }},
                upsert: true
            }
        }));

        const clientOperations = records.map(rec => ({
            updateOne: {
                filter: { parentId: rec.parentId, clientId: req.dbUser._id },
                update: { $set: {
                    parentId: rec.parentId,
                    clientId: req.dbUser._id,
                    SoldeValue: rec.SoldeValue,
                    newSold: rec.newSold
                }},
                upsert: true
            }
        }));

        await Promise.all([
            GlobalElements.bulkWrite(globalOperations),
            Arborescence.bulkWrite(clientOperations)
        ]);

        res.status(200).json({ success: true, message: 'Arborescence uploaded and processed successfully' });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Error processing upload', error: error.message });
    }
}

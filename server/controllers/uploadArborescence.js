const Arborescence = require('../models/Arborescence2.model');
const GlobalElements = require('../models/GlobalElements.model');
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
        // 1. Fetch the entire arborescence structure from GlobalElements database collection
        const globalDocs = await GlobalElements.find({});
        if (globalDocs.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'La structure globale du diagramme n\'a pas encore été initialisée dans la base de données.' 
            });
        }

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

        // Map global elements with client-uploaded balances
        let records = globalDocs.map(doc => {
            const g = doc.toObject();
            const SoldeValue = balanceMap[g.parentId] !== undefined
                ? balanceMap[g.parentId]
                : 0;

            return {
                parentId: g.parentId,
                childrenIds: g.childrenIds || [],
                formula: g.Formula || "",
                method: g.Method || "",
                category: g.Category || "",
                typology: g.Typology || "",
                eleType: g.EleType || "",
                nameFr: g.NameFr || "",
                nameAn: g.NameAn || "",
                nameAr: g.NameAr || "",
                signification: g.Signification || "none",
                interpretation: g.Interpretation || "none",
                recommandations: g.Recommandations || "none",
                example: g.Example || "none",
                Reports: g.Reports || "none",
                newSold: null,
                SoldeValue,
                clientId: req.dbUser._id
            };
        });

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

        const clientOperations = records.map(rec => ({
            updateOne: {
                filter: { parentId: rec.parentId, clientId: req.dbUser._id },
                update: {
                    $set: {
                        parentId: rec.parentId,
                        clientId: req.dbUser._id,
                        SoldeValue: rec.SoldeValue,
                        newSold: rec.newSold,
                        childrenIds: rec.childrenIds,
                        formula: rec.formula,
                        method: rec.method,
                        category: rec.category,
                        typology: rec.typology,
                        eleType: rec.eleType,
                        nameFr: rec.nameFr,
                        nameAn: rec.nameAn,
                        nameAr: rec.nameAr,
                        signification: rec.signification,
                        interpretation: rec.interpretation,
                        recommandations: rec.recommandations,
                        example: rec.example,
                        Reports: rec.Reports
                    }
                },
                upsert: true
            }
        }));

        await Arborescence.bulkWrite(clientOperations);

        res.status(200).json({ success: true, message: 'Arborescence uploaded and processed successfully' });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: 'Error processing upload', error: error.message });
    }
}

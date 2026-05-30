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
        // 1. Fetch the entire arborescence structure from GlobalElements database collection
        const globalDocs = await GlobalElements.find({});
        if (globalDocs.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'La structure globale du diagramme n\'a pas encore été initialisée dans la base de données.' 
            });
        }

        // 2. Parse the balances sheet ('Base-EC-Values')
        const valuesSheetRaw = workbook.Sheets['Base-EC-Values'];
        if (!valuesSheetRaw) {
            return res.status(400).json({
                success: false,
                message: 'Feuille "Base-EC-Values" introuvable dans le fichier Excel. Vérifiez que le nom de la feuille est correct.'
            });
        }

        const valuesData = xlsx.utils.sheet_to_json(valuesSheetRaw);

        // ── 3. VALIDATION ENGINE ─────────────────────────────────────────────
        // Parse the Excel into grouped blocks: each EC parent + its child rows
        const excelGroups = []; // [{ ecId, label, children: [{id, label}] }]
        let currentGroup = null;
        for (const row of valuesData) {
            const numEC    = row['NumEC'];
            const childId  = String(row['Qui apparaissent dans la balance'] || row['Qui apparaissent dans le BL et CPC'] || '').trim();
            const label    = String(row['Intitulé des comptes'] || '').trim();

            if (numEC) {
                // This is a parent EC row
                currentGroup = { ecId: String(numEC).trim(), label, children: [] };
                excelGroups.push(currentGroup);
            } else if (currentGroup && childId && label) {
                // This is a child row belonging to the current EC
                currentGroup.children.push({ id: childId, label });
            }
        }

        // Fetch all BaseElements from DB and build a lookup map by Name (e.g. 'EC025')
        const baseElementsDocs = await BaseElements.find({}).lean();
        const dbBaseMap = {};
        for (const doc of baseElementsDocs) {
            dbBaseMap[doc.Name] = {
                label: doc.Label || '',
                children: (doc.Children || []).map(c => ({ id: String(c.id || '').trim(), label: String(c.Label || '').trim() }))
            };
        }

        const validationErrors = [];

        for (const group of excelGroups) {
            const dbEntry = dbBaseMap[group.ecId];

            // Check 1: Does this EC element exist in the DB?
            if (!dbEntry) {
                validationErrors.push(
                    `❌ Élément de base "${group.ecId}" (Intitulé dans Excel: "${group.label}") introuvable dans la base de données.`
                );
                continue; // Can't validate children if parent doesn't exist
            }

            const dbChildMap = {};
            for (const c of dbEntry.children) {
                dbChildMap[c.id] = c.label;
            }

            // Build a set of IDs present in the Excel for this EC
            const excelChildIds = new Set(group.children.map(c => c.id));

            for (const excelChild of group.children) {
                if (!(excelChild.id in dbChildMap)) {
                    // Check 2: Child ID in Excel doesn't exist in DB
                    validationErrors.push(
                        `❌ Sous "${group.ecId}": l'enfant ID="${excelChild.id}" (nom dans Excel: "${excelChild.label}") n'existe pas dans la base de données.`
                    );
                } else if (dbChildMap[excelChild.id].toLowerCase() !== excelChild.label.toLowerCase()) {
                    // Check 3: Child ID exists but label doesn't match
                    validationErrors.push(
                        `⚠️  Sous "${group.ecId}": l'enfant ID="${excelChild.id}" a un nom incorrect — attendu: "${dbChildMap[excelChild.id]}", reçu dans Excel: "${excelChild.label}".`
                    );
                }
            }

            // Check 4: Children in DB that are completely missing from the Excel
            for (const dbChild of dbEntry.children) {
                if (!excelChildIds.has(dbChild.id)) {
                    validationErrors.push(
                        `⚠️  Sous "${group.ecId}": l'enfant ID="${dbChild.id}" (nom attendu: "${dbChild.label}") est présent dans la base de données mais absent du fichier Excel.`
                    );
                }
            }
        }


        // If there are validation errors, stop and report them all
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Le fichier contient ${validationErrors.length} erreur(s) de validation. Aucune donnée n'a été importée.`,
                errors: validationErrors
            });
        }
        // ── END VALIDATION ───────────────────────────────────────────────────

        // Build the balanceMap from validated data
        const balanceMap = {};
        valuesData.forEach(row => {
            const id  = row['NumEC'] || row['ID'] || row['id'] || row['numec'];
            const val = row['SoldeValue'] || row['solde'] || row['Value'] || row['Valeur'];
            if (id) balanceMap[String(id).trim()] = Number(val) || 0;
        });

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

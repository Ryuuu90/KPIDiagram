const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GlobalElements = require('../models/GlobalElements.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Connected to MongoDB for seeding...'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function seed() {
    try {
        const filePath = path.join(__dirname, '../public/Arborescence2.xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[8]; // Assuming sheet 9
        const arboSheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`Parsed ${arboSheet.length} rows from Excel.`);

        const globalOperations = arboSheet.map(row => {
            const parentId = row["ID"];
            const formula = row["Méthode de calcul Numérique"] || "";
            const eleType = row["ElementType"];
            
            let childrenIds = [];
            if (eleType === 'EC') {
                childrenIds = formula.split(/[+-]/).map(id => id.trim()).filter(id => id);
            } else if (eleType === 'Ratio') {
                childrenIds = [...new Set(formula.match(/EC\d+|R\d{2}/g) || [])];
            } else if (formula) {
                childrenIds = formula.split(/[.]/).map(id => id.trim()).filter(id => id);
            }

            return {
                updateOne: {
                    filter: { parentId: parentId },
                    update: { $set: {
                        parentId: parentId,
                        childrenIds: childrenIds,
                        Formula: formula,
                        Method: row["Méthode de calcul"],
                        Category: row["Catégorie"],
                        Typology: row["Typologie"],
                        EleType: eleType,
                        NameFr: row["NomFr"],
                        NameAn: row["NomAn"],
                        NameAr: row["NomAr"],
                        Signification: row["Signification"] || "none",
                        Interpretation: row["Interprétation"] || "none",
                        Recommandations: row["Recommandations"] || "none",
                        Example: row["Exemple"] || "none",
                        Reports: row["Rapports"] || "none"
                    }},
                    upsert: true
                }
            };
        });

        console.log('Starting bulk write to GlobalElements...');
        const result = await GlobalElements.bulkWrite(globalOperations);
        console.log(`Successfully seeded GlobalElements! (Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount})`);

        mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('Seeding failed:', error);
        mongoose.connection.close();
    }
}

seed();

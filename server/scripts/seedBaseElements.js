const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BaseElements = require('../models/BaseElements.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Connected to MongoDB for seeding BaseElements...'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function seed() {
    try {
        const filePath = path.join(__dirname, '../public/Arborescence2.xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // First sheet
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        console.log(`Parsed ${data.length} rows from Excel.`);

        const baseElementsMap = [];
        let currentParent = null;

        // Start from row 1 (assuming row 0 is headers or skip them if they are not formatted)
        // Based on inspection, we should start looking for NumEC
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const numEc = row[0]; // NumEC column
            const qui2 = row[2];  // Second "qui" column (children)
            const name = row[3];  // Intitulé des comptes

            if (numEc && typeof numEc === 'string' && numEc.startsWith('EC')) {
                // New Parent indicator group
                currentParent = {
                    Name: numEc,
                    Label: name,
                    Children: []
                };
                baseElementsMap.push(currentParent);
            } else if (currentParent && qui2) {
                // Row under a parent with a child ID in column 3 (index 2)
                currentParent.Children.push({
                    id: String(qui2),
                    Label: name
                });
            }
        }

        console.log(`Identified ${baseElementsMap.length} parent indicators.`);

        const operations = baseElementsMap.map(item => ({
            updateOne: {
                filter: { Name: item.Name },
                update: { $set: { Label: item.Label, Children: item.Children } },
                upsert: true
            }
        }));

        console.log('Starting bulk write to BaseElements...');
        const result = await BaseElements.bulkWrite(operations);
        console.log(`Successfully seeded BaseElements! (Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount})`);

        mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('Seeding failed:', error);
        mongoose.connection.close();
    }
}

seed();

const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public/Arborescence2.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[8];
const arboSheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

const r01Row = arboSheet.find(row => row["ID"] === 'R01');
console.log('R01 Excel Row:', JSON.stringify(r01Row, null, 2));
process.exit(0);

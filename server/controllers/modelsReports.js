const ESG = require('../models/ESG');
const Passif = require('../models/Passif');
const Actif = require('../models/Actif');
const CPC = require('../models/CPC');
const Arborescence = require('../models/Arborescence2.model');
const path = require('path')


const xlsx = require('xlsx');



exports.modelsReports = async (req , res) => {
    const {reportType} = req.body;
    
    try
    {
        const workbook = xlsx.readFile(path.join(__dirname, '../public', 'modelsReports.xlsx'))
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[reportType]);

        const data = await Arborescence.find({});
        const dataMap = Object.fromEntries(
            data.map(elem => [elem.parentId, elem])
          );
        let report;
        if(reportType === 'ESG')
        {
            // const produit = data.find(elem => elem.parentId === 'EC090').SoldeValue;
            // console.log(produit);
            report = sheet.filter(row => row['Definition'] && row['Definition']!== " ").map((row, index) =>{
                const element = row['NumEC'] ? dataMap[row['NumEC']] : null;
                return({
                     order : index,
                    "NumEC" : element ? element.parentId : null,
                    "Definition" : row.Definition,
                    "Exercice" : element ? element.SoldeValue : null,
                    "Exercice Precedent" : element ? 0 : null,
                })
            })

            // await ESG.create(esg);
        }
        if(reportType === 'Passif')
        {
            report = sheet.filter(row => row['PASSIF'] && row['PASSIF'] !== " ").map((row, index) =>{
                const element = row['NumEC'] ? dataMap[row['NumEC']] : null;
                return({
                     order : index,
                    "NumEC" : element ? element.parentId : null,
                    "Passif" :row['PASSIF'],
                    "Exercice" : element ? element.SoldeValue : null,
                    "Exercice Precedent" : element ? 0 : null,
                })
            })

            // await Passif.create(esg);
        }
        if(reportType === 'Actif')
        {
            report = sheet.filter(row => row['ACTIF']  &&  row['ACTIF'] !== " ").map((row , index)=>{
                const element1 = row['NumEC F'] ? dataMap[row['NumEC F']] : null ;
                const element2 = row['NumEC G'] ? dataMap[row['NumEC G']] : null ;
                const element3 = row['NumEC H'] ? dataMap[row['NumEC H']] : null ;
                
                return({
                        order : index,
                    "NumEC F" : element1 ? element1.parentId : null,
                    "NumEC G" : element2 ? element2.parentId : null,
                    "NumEC H" : element3 ? element3.parentId : null,
                    "Actif" : row['ACTIF'],
                    "Exercice" : {"Brut" : element1 ? element1.SoldeValue : null , "Amortissements et provisions" :  element2 ? element2.SoldeValue : null , "Net" : element3 ? element3.SoldeValue : null },
                    "Exercice Precedent" : element1 ? 0 : null
                })
            })

            // await Actif.create(esg);
        }

        if(reportType === 'CPC')
        {
            report = sheet.filter(row=> row['Nature '] && row['Nature '] !== " ").map((row , index)=>{
                const element1 = row['NumEC1'] ? dataMap[row['NumEC1']] : null ;
                const element2 = row['NumEC2'] ? dataMap[row['NumEC2']] : null ;
                const element3 = row['NumEC3'] ? dataMap[row['NumEC3']] : null ;
                return({
                    order : index,
                    "NumEC F" : element1 ? element1.parentId : null,
                    "NumEC G" : element2 ? element2.parentId : null,
                    "NumEC H" : element3 ? element3.parentId : null,
                    "Nature" : row['Nature '],
                    "Operations propres l'exercice" : element1 ? element1.SoldeValue : null , "Operations concernant les exercices precedents" :  element2 ? element2.SoldeValue : null , "TOTAUX DE L'EXERCICE (3 = 2+1)" : element3 ? element3.SoldeValue : null,
                    "Totaux de l'exercice precedent" : element1 ? 0 : null
                })
            })

            // await CPC.create(esg);
        }

        // console.log(esg);

        // let report;
        // if(reportType === 'ESG')
        //     report = await ESG.find({}).sort({ order: 1 });
        // else if(reportType === 'Passif')
        //     report = await Passif.find({}).sort({ order: 1 });
        // else if(reportType === 'Actif')
        //     report = await Actif.find({}).sort({ order: 1 });
        // else if(reportType === 'CPC')
        //     report = await CPC.find({}).sort({ order: 1 });

        // console.log(data);

        res.status(200).json({success : true, message : "getting report data", report : report});
    }
    catch(error)
    {
        res.status(500).json({ success: false, message: 'getting report data error', error: error.message });

    }
    


    // if(reportType === "ESG")
    // {
        
    // }

}

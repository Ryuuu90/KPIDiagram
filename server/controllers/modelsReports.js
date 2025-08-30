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
        // const workbook = xlsx.readFile(path.join(__dirname, '../public', 'modelsReports.xlsx'))
        // const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[reportType]);

        // const data = await Arborescence.find({});
        // let esg;
        // if(reportType === 'ESG')
        // {
        //     esg = sheet.map(row =>{
        //         const element = row['NumEC'] ? data.find(elem => elem.parentId === row['NumEC']) : null;
        //         return({
        //             "NumEC" : element ? element.parentId : null,
        //             "Definition" : row['NumEC'] ? row.Definition : null,
        //             "Exercice" : element ? element.SoldeValue : null,
        //             "Exercice Precedent" : element ? 0 : null,
        //         })
        //     })

        //     await ESG.create(esg);
        // }
        // if(reportType === 'Passif')
        // {
        //     esg = sheet.map(row =>{
        //         const element = row['NumEC'] ? data.find(elem => elem.parentId === row['NumEC']) : null;
        //         return({
        //             "NumEC" : element ? element.parentId : null,
        //             "Passif" : row['NumEC'] ? row.Definition : null,
        //             "Exercice" : element ? element.SoldeValue : null,
        //             "Exercice Precedent" : element ? 0 : null,
        //         })
        //     })

        //     await Passif.create(esg);
        // }
        // if(reportType === 'Actif')
        // {
        //     esg = sheet.map(row =>{
        //         const element1 = row['NumEC F'] ? data.find(elem => elem.parentId === row['NumEC F']) : null ;
        //         const element2 = row['NumEC G'] ? data.find(elem => elem.parentId === row['NumEC G']) : null ;
        //         const element3 = row['NumEC H'] ? data.find(elem => elem.parentId === row['NumEC H']) : null ;
                
        //         return({
        //             "NumEC F" : element1 ? element1.parentId : null,
        //             "NumEC G" : element2 ? element2.parentId : null,
        //             "NumEC H" : element3 ? element3.parentId : null,
        //             "Actif" : row['ACTIF'],
        //             "Exercice" : {"Brut" : element1 ? element1.SoldeValue : null , "Amortissements et provisions" :  element2 ? element2.SoldeValue : null , "Net" : element3 ? element3.SoldeValue : null },
        //             "Exercice Precedent" : element1 ? 0 : null
        //         })
        //     })

        //     await Actif.create(esg);
        // }

        // if(reportType === 'CPC')
        // {
        //     esg = sheet.map(row =>{
        //         const element1 = row['NumEC1'] ? data.find(elem => elem.parentId === row['NumEC1']) : null ;
        //         const element2 = row['NumEC2'] ? data.find(elem => elem.parentId === row['NumEC2']) : null ;
        //         const element3 = row['NumEC3'] ? data.find(elem => elem.parentId === row['NumEC3']) : null ;
        //         console.log(row);
        //         return({
        //             "NumEC F" : element1 ? element1.parentId : null,
        //             "NumEC G" : element2 ? element2.parentId : null,
        //             "NumEC H" : element3 ? element3.parentId : null,
        //             "Nature" : row['Nature '],
        //             "Operations propres l'exercice" : element1 ? element1.SoldeValue : null , "Operations concernant les exercices precedents" :  element2 ? element2.SoldeValue : null , "TOTAUX DE L'EXERCICE (3 = 2+1)" : element3 ? element3.SoldeValue : null,
        //             "Totaux de l'exercice precedent" : element1 ? 0 : null
        //         })
        //     })

        //     await CPC.create(esg);
        // }

        // console.log(esg);

        let data;
        if(reportType === 'ESG')
            data = await ESG.find({});
        else if(reportType === 'Passif')
            data = await Passif.find({});
        else if(reportType === 'Actif')
            data = await Actif.find({});
        else if(reportType === 'CPC')
            data = await CPC.find({});

        console.log(data);

        res.status(200).json({success : true, message : "getting report data", report : data});
    }
    catch(error)
    {
        res.status(500).json({ success: false, message: 'getting report data error', error: error.message });

    }
    


    // if(reportType === "ESG")
    // {
        
    // }

}

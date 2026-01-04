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
            let total = 0;
            report = sheet.filter(row => row['PASSIF'] && row['PASSIF'] !== " ").map((row, index) =>{
                let sold = 0;
                const element = row['NumEC'] ? dataMap[row['NumEC']] : null;
                sold = element ? element.SoldeValue : 0;
                if(row['PASSIF'] === 'TOTAL I (A+B+C+D+E)')
                {
                    sold = dataMap['EC052'].SoldeValue + dataMap['EC098'].SoldeValue + dataMap['EC046'].SoldeValue + dataMap['EC027'].SoldeValue + dataMap['EC026'].SoldeValue;
                    total += sold;
                }
                if(row['PASSIF'] === 'TOTAL II (F+G+H)')
                {
                    sold = dataMap['EC017'].SoldeValue + dataMap['EC210'].SoldeValue + dataMap['EC128'].SoldeValue
                    total += sold;
                }
                if( row['PASSIF'] === 'TOTAL III')
                    sold = total + dataMap['EC117'].SoldeValue;
                return({
                     order : index,
                    "NumEC" : element ? element.parentId : null,
                    "Passif" :row['PASSIF'],
                    "Exercice" : sold ,
                    "Exercice Precedent" : element ? 0 : null,
                })
            })

            // await Passif.create(esg);
        }
        if(reportType === 'Actif')
        {
            let total = 0;
            report = sheet.filter(row => row['ACTIF']  &&  row['ACTIF'] !== " ").map((row , index)=>{
                let sold1 = 0;
                let sold2 = 0;

                const element1 = row['NumEC F'] ? dataMap[row['NumEC F']] : null ;
                const element2 = row['NumEC G'] ? dataMap[row['NumEC G']] : null ;
                const element3 = row['NumEC H'] ? dataMap[row['NumEC H']] : null ;
                sold2 = element2 ? element2.SoldeValue : null;
                sold1 = element1 ? element1.SoldeValue : null;

                if(row['ACTIF'] === 'IMMOBILISATIONS INCORPORELLES (B)')
                {
                    sold2 = dataMap['EC152'].SoldeValue + dataMap['EC153'].SoldeValue + dataMap['EC154'].SoldeValue + dataMap['EC155'].SoldeValue;
                    total += sold2;
                }
                if(row['ACTIF'] === 'IMMOBILISATIONS CORPORELLES (C)')
                {
                    sold2 = dataMap['EC156'].SoldeValue + dataMap['EC157'].SoldeValue + dataMap['EC158'].SoldeValue + dataMap['EC159'].SoldeValue + dataMap['EC160'].SoldeValue + dataMap['EC161'].SoldeValue + dataMap['EC162'].SoldeValue
                    total += sold2;
                }
                if( row['ACTIF'] === 'IMMOBILISATIONS FINANCIERES (D)')
                {
                    sold2 = dataMap['EC164'].SoldeValue + dataMap['EC165'].SoldeValue + dataMap['EC166'].SoldeValue + dataMap['EC167'].SoldeValue;
                    total += sold2;
                }
                if( row['ACTIF'] === 'ECARTS DE CONVERSION - ACTIF (E)')
                {
                    sold2 = dataMap['EC141'].SoldeValue + dataMap['EC142'].SoldeValue
                    total += sold2;
                }
                if( row['ACTIF'] === 'TOTAL I (A+B+C+D+E)')
                {
                    sold2 = total + dataMap['EC251'].SoldeValue;
                    sold1 = dataMap['EC068'].SoldeValue + dataMap['EC070'].SoldeValue + dataMap['EC066'].SoldeValue + dataMap['EC069'].SoldeValue + dataMap['EC051'].SoldeValue
                }
                if(row['ACTIF'] === 'STOCKS (F)')
                {
                    total = 0;
                    sold2 = dataMap['EC168'].SoldeValue + dataMap['EC169'].SoldeValue + dataMap['EC170'].SoldeValue + dataMap['EC171'].SoldeValue + dataMap['EC172'].SoldeValue;
                    total += sold2;
                }
                if(row['ACTIF'] === "CREANCES DE L'ACTIF CIRCULANT (G)")
                {
                    sold2 = dataMap['EC173'].SoldeValue + dataMap['EC174'].SoldeValue + dataMap['EC175'].SoldeValue + dataMap['EC176'].SoldeValue + dataMap['EC177'].SoldeValue ;
                    total += sold2;
                }
                if( row['ACTIF'] === 'TITRES ET VALEURS DE PLACEMENT (H)')
                {
                    sold2 = dataMap['EC178'].SoldeValue 
                    total += sold2;
                }
                if( row['ACTIF'] === 'TOTAL II (F+G+H+I)')
                {
                    sold2 = total
                    sold1 = dataMap['EC125'].SoldeValue + dataMap['EC258'].SoldeValue + dataMap['EC115'].SoldeValue + dataMap['EC209'].SoldeValue ;
                }
                return({
                        order : index,
                    "NumEC F" : element1 ? element1.parentId : null,
                    "NumEC G" : element2 ? element2.parentId : null,
                    "NumEC H" : element3 ? element3.parentId : null,
                    "Actif" : row['ACTIF'],
                    "Exercice" : {"Brut" : sold1 , "Amortissements et provisions" : sold2 , "Net" : sold1 - sold2 },
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
                    "Operations propres l'exercice" : element1 ? element1.SoldeValue : null , "Operations concernant les exercices precedents" :  element2 ? element2.SoldeValue : null , "TOTAUX DE L'EXERCICE (3 = 2+1)" : element3 ? element3.SoldeValue : element1 ? element1.SoldeValue : null,
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

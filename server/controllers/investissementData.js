const Arborescence = require('../models/Arborescence2.model');




exports.investissementData = async (req, res) =>{
    const {reportType} = req.body;

    try{

        const data = await Arborescence.find({});
        const dataMap = Object.fromEntries(
            data.map(elem => [elem.parentId, elem])
          );
          
        const sumSolde = (ids) =>
        ids.reduce((sum, id) => id === 'EC212' || id === 'EC117' ? sum - (dataMap[id]?.SoldeValue || 0) : sum + (dataMap[id]?.SoldeValue || 0), 0);
        
        let report;
          
        if (reportType === 'CPC') 
        {
            report = {
                Produits: dataMap['EC090']?.SoldeValue || 0,
                Achats: sumSolde(['EC005', 'EC008', 'EC004', 'EC072', 'EC007']),
                Personnel: dataMap['EC032']?.SoldeValue || 0,
                Dotations: dataMap['EC048']?.SoldeValue || 0,
                "Résultat financier": dataMap['EC107']?.SoldeValue || 0,
                "Résultat exceptionnel" :  dataMap['EC106']?.SoldeValue || 0,
                IS: dataMap['EC073']?.SoldeValue || 0,
            };
            report["Résultat net"] =  report.Produits - (report.Achats+ report.Personnel +  report['IS'] + report.Dotations) + report['Résultat financier'] + report['Résultat exceptionnel'] ;
        }
        // let passif;
        if (reportType === 'Actif') 
        {
            let passif = {
                Capital: sumSolde(['EC025', 'EC212', 'EC053', 'EC088', 'EC148']),
                Réserves: sumSolde(['EC104', 'EC018', 'EC100', 'EC109', 'EC112', 'EC099', 'EC098', 'EC148']),
                "Résultat net": dataMap['EC108']?.SoldeValue || 0,
                "Dettes de financement": dataMap['EC046']?.SoldeValue || 0,
                "Dettes fournisseurs": sumSolde(['EC128', 'EC017', 'EC210']),
            };
            passif.Total = passif.Capital + passif.Réserves + passif['Résultat net'] + passif['Dettes de financement'] + passif['Dettes fournisseurs']
            report = {
                Immobilisations: sumSolde(['EC068', 'EC070', 'EC066', 'EC069']),
                Amortissement: sumSolde(['EC152', 'EC153', 'EC154', 'EC155', 'EC156', 'EC157', 'EC158', 'EC159',
                                         'EC160', 'EC161', 'EC162', 'EC164', 'EC165', 'EC166', 'EC167', 'EC141',
                                         , 'EC142', 'EC251']),
                Stock: dataMap['EC248']?.SoldeValue || 0,
                Créances: dataMap['EC249']?.SoldeValue || 0,
            };
            report['Trésorerie'] = dataMap['EC257'].SoldeValue - dataMap['EC117'].SoldeValue
            report.Total = report.Immobilisations - report.Amortissement + report.Créances + report.Stock + report.Trésorerie
            
        }
        if (reportType === 'Passif') 
        {
            report = {
                Capital: sumSolde(['EC025', 'EC212', 'EC053', 'EC088', 'EC148']),
                Réserves: sumSolde(['EC104', 'EC018', 'EC100', 'EC109', 'EC112', 'EC099', 'EC098',  'EC148']),
                "Résultat net": dataMap['EC108']?.SoldeValue || 0,
                "Dettes de financement": dataMap['EC046']?.SoldeValue || 0,
                "Dettes fournisseurs": sumSolde(['EC128', 'EC017', 'EC210']),
            };
            report.Total = report.Capital + report.Réserves + report['Résultat net'] + report['Dettes de financement'] + report['Dettes fournisseurs']
        }
        res.status(200).json({ success : true , message : "investissement reporsts are ready", report : report });
    }
    catch(error)
    {
        res.status(500).json({success : false , message : "error in investissement reports", error : error.message});
    }
}
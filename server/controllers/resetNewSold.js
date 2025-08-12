const Arborescence = require("../models/Arborescence2.model");

exports.resetNewSold = async (req, res)=>{
    try{
        await Arborescence.updateMany({}, { $set: { newSold: null } });

        res.status(200).json({success : true, message : "newSold has been reset."});
    }
    catch(error)
    {
        res.status(500).json({success : false, message : "Error reseting newSold."})
    }
}
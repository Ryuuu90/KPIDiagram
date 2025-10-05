const Arborescence = require('../models/Arborescence2.model');

exports.getAffectedElements = async (req, res)=>{

    try
    {
        const {affected} = req.body;
        if (!Array.isArray(affected) || affected.length === 0) {
            return res.status(400).json({
              success: false,
              message: "No affected IDs provided"
            });
        }
        const elements = await Arborescence.find({parentId: {$in: affected}}).lean();
        return res.status(200).json({success : true, message : 'The affected elements were fetched successfully', elements : elements});
    }
    catch(error)
    {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }


}
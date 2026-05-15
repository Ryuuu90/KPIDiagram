const Arborescence = require('../models/Arborescence2.model');

exports.checkDataPresence = async (req, res) => {
    try {
        const count = await Arborescence.countDocuments({ clientId: req.dbUser._id });
        res.status(200).json({ success: true, hasData: count > 0 });
    } catch (error) {
        console.error("Error checking data presence:", error);
        res.status(500).json({ success: false, message: 'Error checking data presence' });
    }
};

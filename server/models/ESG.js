const mongoose = require('mongoose');


const esg = mongoose.Schema({
    order : Number,
    "NumEc" : String,
    Definition : String,
    Exercice : Number,
    "Exercice Precedent" : Number,
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    }
})


const ESG = mongoose.model("ESG", esg);

module.exports = ESG;
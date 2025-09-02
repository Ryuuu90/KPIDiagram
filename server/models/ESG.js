const mongoose = require('mongoose');


const esg = mongoose.Schema({
    order : Number,
    "NumEc" : String,
    Definition : String,
    Exercice : Number,
    "Exercice Precedent" : Number,
})


const ESG = mongoose.model("ESG", esg);

module.exports = ESG;
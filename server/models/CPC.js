const mongoose = require('mongoose');


const cpc = mongoose.Schema({
    order : Number,
    "NumEC F" : String,
    "NumEC G" : String,
    "NumEC H" : String,
    Nature : String,
    "Operations propres l'exercice" : Number,
    "Operations concernant les exercices precedents" : Number,
    "TOTAUX DE L'EXERCICE (3 = 2+1)" : Number,
    "Totaux de l'exercice precedent" : Number,
})


const CPC = mongoose.model("CPC", cpc);

module.exports = CPC;
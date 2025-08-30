const mongoose = require('mongoose');


const actif = mongoose.Schema({
    "NumEc colonne F" : String,
    "NumEc colonne G" : String,
    "NumEc colonne H" : String,
    Actif : String,
    Exercice : Object,
    "Exercice Precedent" : Number,
})


const Actif = mongoose.model("Actif", actif);

module.exports = Actif;
const mongoose = require('mongoose');


const passif = mongoose.Schema({
    order : Number,
    "NumEc colonne F" : String,
    Passif : String,
    Exercice : Number,
    "Exercice Precedent" : Number,
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    }
})


const Passif = mongoose.model("Passif", passif);

module.exports = Passif;
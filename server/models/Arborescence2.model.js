const mongoose = require('mongoose');


const arborescence2 = new mongoose.Schema({
    parentId : String,
    childrenIds : Array,
    category : String,
    formula : String,
    type :  String,
    typology : String,
    eleType : String,
    nameFr : String,
    nameAn : String,
    nameAr : String,
    signification : String,
    interpretation : String,
    recommandations : String,
    example : String,
    SoldeValue : Number,
    method : String,
    Reports : String,
})

const Arborescence2  = mongoose.model("Arborescence2", arborescence2);
module.exports = Arborescence2;
const mongoose = require('mongoose');


const globalElements = mongoose.Schema({
    parentId : String,
    childrenIds : Array,
    Formula : String,
    Method: String,
    Category : String,
    Typology : String,
    EleType : String,
    NameFr : String,
    NameAn : String,
    NameAr : String,
    Signification : String,
    Interpretation : String,
    Recommandations : String,
    Example : String,
    Reports : String
})


const GlobalElements = mongoose.model("GlobalElements", globalElements);

module.exports = GlobalElements;
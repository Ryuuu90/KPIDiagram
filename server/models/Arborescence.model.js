const mongoose = require('mongoose');


const arborescence = new mongoose.Schema({
    reportName : String,
    parentId : String,
    parentName : String,
    level : String,
    childrenIds : Array,
    childrenData : Object
})

const Arborescence  = mongoose.model("Arborescence", arborescence);
module.exports = Arborescence;
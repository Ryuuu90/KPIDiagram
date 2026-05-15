const mongoose = require('mongoose');

const baseElements = mongoose.Schema({
    Name : String,    // Indicator ID (e.g., EC088)
    Label: String,   // Account Name (e.g., Primes d’émission...)
    Children : Array // Array of { id: string, name: string }
})


const BaseElements = mongoose.model("BaseElements", baseElements);

module.exports = BaseElements;
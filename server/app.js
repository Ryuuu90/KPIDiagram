const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const router = require('./routes/routes');

dotenv.config()

const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
};


const app = express();
const PORT = process.env.PORT || 8000;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(cors(corsOptions));
app.use(express.json());
mongoose.connect(MONGODB_URL).then(() => {
    console.log("DB is connected");
})
app.use('/api', router);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });
}

module.exports = app;


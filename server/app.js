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
const PORT = 8000 || process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(cors(corsOptions));
app.use(express.json());
mongoose.connect(MONGODB_URL).then(()=>{
    console.log("DB is connected");
})
app.use('/api', router);

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})


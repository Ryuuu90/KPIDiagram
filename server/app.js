const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const router = require('./routes/routes');
const authRoutes = require('./routes/authRoutes');

const morgan = require("morgan");



dotenv.config()

const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};


const app = express();
const PORT = 8000 || process.env.PORT;      
const MONGODB_URL = process.env.MONGODB_URL;


//add these middleware
app.use(cors(corsOptions));
app.use(express.json());
mongoose.connect(MONGODB_URL).then(()=>{
    console.log("DB is connected");
})
    //add these middleware
app.use(morgan("dev"));
app.use('/api', router);
app.use('/api/auth', authRoutes);

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);
})


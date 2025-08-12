const {saveToDatabase} = require('../controllers/saveToDatabase');
const {saveToDatabase2} = require('../controllers/saveToDatabase2');

const {getNodeById} = require('../controllers/nodesData')
const {getNodeById2} = require('../controllers/nodesData2')

const {resetNewSold} = require('../controllers/resetNewSold');

const express = require('express');
const router = express.Router();

router.get('/data', saveToDatabase);
router.get('/data2', saveToDatabase2);

// router.post('/getData', nodesData);
router.get('/node/:id', getNodeById);
router.post('/node2/:id', getNodeById2);

router.get('/reset', resetNewSold);



module.exports = router;
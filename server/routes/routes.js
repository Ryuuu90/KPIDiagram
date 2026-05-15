const {saveToDatabase} = require('../controllers/saveToDatabase');
const {uploadArborescence} = require('../controllers/uploadArborescence');

const {getNodeById} = require('../controllers/nodesData')

const {resetNewSold} = require('../controllers/resetNewSold');
const {ArborescenceCalcul} = require('../controllers/ArborescenceCalcul');
const {modelsReports} = require('../controllers/modelsReports');
const {searchForBE} = require('../controllers/searchForBE');
const {getAffectedElements} = require('../controllers/getAffectedElements');
const {investissementData} = require('../controllers/investissementData');
const {checkDataPresence} = require('../controllers/checkData');



const express = require('express');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/data', verifyToken, saveToDatabase);


// router.post('/getData', nodesData);
router.post('/node/:id', verifyToken, getNodeById);

router.get('/reset', verifyToken, resetNewSold);
router.post('/calculation', verifyToken, ArborescenceCalcul);

router.post('/reports', verifyToken, modelsReports);
router.post('/search', verifyToken, searchForBE);
router.post('/affected', verifyToken, getAffectedElements);
router.post('/investissment', verifyToken, investissementData);
router.post('/upload-arborescence', verifyToken, upload.single('file'), uploadArborescence);
router.get('/check-data', verifyToken, checkDataPresence);






module.exports = router;
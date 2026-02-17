const express = require('express');
const bodyParser= require('body-parser');
const cors = require('cors');

const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const suiteRoutes = require('./routes/consultationSuiteRoutes');

const app=express();
console.log('patients:', patientRoutes);
console.log('doctors:', doctorRoutes);
console.log('appointments:', appointmentRoutes);
app.use(cors());
app.use(bodyParser.json());
app.use('/api/patients',patientRoutes);
app.use('/api/doctors',doctorRoutes);
app.use('/api/appointments',appointmentRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/suites', suiteRoutes);
app.listen(5000,()=>{console.log("server running on port 5000");});




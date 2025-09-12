const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require("mysql2/promise");

const authRoutes = require('./routes/auth');
const balanceRoutes = require('./routes/balance');
const profileRoutes = require('./routes/profile');
const transactionRoutes = require('./routes/transactions');
const ActivityHistoryRoutes = require('./routes/ActivityHistory');

const InitialAssessementRoutes = require('./routes/InitialAssessment');
const SecondaryAssessementRoutes = require('./routes/SecondaryAssessment');
const assessmentRoute = require("./routes/exerciseAssessmentRoute"); 
const exercisePlanResultRoute = require('./routes/ExercisePlanResult');
const NutritionPlanResultRoute = require('./routes/NutritionPlanResult');

const exerciseSessionLogRoute = require("./routes/ExerciseSessionLog");
const resultRoute = require("./routes/ResultRoutes");

const GymActivityRoute = require('./routes/gymActivity');

const exerciseRoutes = require('./routes/Exercises');
const exerciseLogsRoute = require('./routes/ExercisesLogs');



dotenv.config();
console.log('DB_USER from .env:', process.env.DB_USER);

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️ Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', balanceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', ActivityHistoryRoutes);

app.use('/api', InitialAssessementRoutes); 
app.use('/api', SecondaryAssessementRoutes); 
app.use('/api', assessmentRoute); 
app.use("/api", exercisePlanResultRoute);
app.use("/api", NutritionPlanResultRoute);

app.use("/api", exerciseSessionLogRoute);
app.use("/api/results-routes", resultRoute);

app.use("/api", GymActivityRoute);
app.use('/api', exerciseRoutes);
app.use("/api", exerciseLogsRoute);


console.log('Starting server...');
console.log('✅ /api/activity-history route mounted');


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SwiftPassMobiApp API running on port ${PORT}`);
});

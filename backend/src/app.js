// const express = require('express');

// const mongoose = require('mongoose');



// // Middlewares

// const setupMiddleware = require('./middleware'); // Your index.js middleware file



// // Routes

// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const taskRoutes = require('./routes/tasks');
// const notificationRoutes = require('./routes/notifications');

// const app = express();



// // 1. Setup global middleware

// setupMiddleware(app);



// // 2. Health check endpoint

// app.get('/health', (req, res) => {

//   res.json({

//     status: 'OK',

//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'

//   });

// });



// // 3. API Routes

// app.use('/api/auth', authRoutes);

// app.use('/api/users', userRoutes);

// app.use('/api/tasks', taskRoutes);

// app.use('/api/notifications', notificationRoutes);



// module.exports = app; 


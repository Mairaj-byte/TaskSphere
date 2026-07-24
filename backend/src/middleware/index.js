const express = require("express");
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173",
  "https://tasksphereportal.onrender.com",
];

const setupMiddleware = (app) => {
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());
};

module.exports = setupMiddleware;
const express = require('express');
const cors = require('cors');

const setupMiddleware = (app) => {
  app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());
};

module.exports = setupMiddleware;
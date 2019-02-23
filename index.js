#!/usr/bin/env node
require('dotenv').config();

const app = require('./dist/app');

app.start(process.argv.slice(2));

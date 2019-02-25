#!/usr/bin/env node
require('dotenv').config();

if (!process.env.GITHUB_TOKEN) {
  console.error(
    'Environment variable GITHUB_TOKEN is required to be set before Git Started can be run',
  );
  console.error(
    'Refer to the README or look look at .env.sample for an example',
  );
  process.exit(1);
}

const app = require('./dist/app');

app.start(process.argv.slice(2));

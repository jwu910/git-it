const axios = require('axios');
const prompts = require('prompts');
const program = require('commander');
const updateNotifier = require('update-notifier');
const path = require('path');

const pkg = require(path.resolve(__dirname, '../package.json'));
const notifier = updateNotifier({ pkg });

if (notifier.update) {
  notifier.notify();
}

export const start = args => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .parse(process.argv);

  const username = program.user

  const options = {
    method: 'GET',
    baseURL: 'https://api.github.com',
    url: `/users/${String(username)}/repos`,
    headers: {
      'Accept': 'application/json',
      'User-Agent': `${username}`
    }
  }

  let reposList = [];

  axios(options).then(
    results => {
      console.log(results.data);
    }
  ).catch(
    error => {
      console.error('Error : ', error);
    }
  );
}

import path from 'path';
import program from 'commander';
import prompts from 'prompts';
import updateNotifier from 'update-notifier';

import { getRepos } from './api/getRepos';

const pkg = require(path.resolve(__dirname, '../package.json'));
const notifier = updateNotifier({ pkg });

if (notifier.update) {
  notifier.notify();
}

export const start = async args => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .parse(process.argv);

  const username = program.user;

  let reposList;

  try {
    const response = await getRepos(username);

    const repositories = response.user.repositories.edges;

    reposList = repositories.map(({ node }) => {
      const { forks, id, name, stargazers } = node;

      return {
        title: `${name} - ${stargazers.totalCount} stars - ${
          forks.totalCount
        } forks`,
        value: id,
      };
    });
  } catch (error) {
    console.log('error : ', error);
  }

  let choice = await prompts({
    type: 'autocomplete',
    name: `id`,
    message: `Pick one of ${username}'s repository to fork`,
    choices: [...reposList],
  });

  console.log('CHOICE : ', choice);
};

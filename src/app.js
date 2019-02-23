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

  try {
    const response = await getRepos(username);

    const repositories = response.user.repositories.edges;

    const reposList = repositories.map(({ node }) => {
      return {
        forks: node.forks.totalCount,
        id: node.id,
        name: node.name,
        stars: node.stargazers.totalCount,
      };
    });
  } catch (error) {
    console.log('error : ', error);
  }
};

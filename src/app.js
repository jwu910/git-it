import chalk from 'chalk';
import path from 'path';
import program from 'commander';
import prompts from 'prompts';
import updateNotifier from 'update-notifier';

import { cloneRepo } from './api/cloneRepo';
import { forkRepo } from './api/forkRepo';
import { getRepos } from './api/getRepos';
import { truncate } from './util/truncate';

const pkg = require(path.resolve(__dirname, '../package.json'));
const notifier = updateNotifier({ pkg });

if (notifier.update) {
  notifier.notify();
}

export const start = async args => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .option('-s --ssh', 'Use SSH url to clone')
    .parse(process.argv);

  const username = program.user;

  let reposList;

  //TODO: prompt for username if none provided
  if (!username) {
    console.error(
      `Use option -u or --user to search repositories by Github use
      \nUsage: git-started -u jwu910`.trim(),
    );

    return;
  }

  try {
    const response = await getRepos(username);

    const repositories = response.user.repositories.edges;

    if (!repositories.length) {
      throw new Error('No repositories found.');
    }

    reposList = repositories.map(({ node }) => {
      const { id, name, stargazers } = node;

      let { description } = node;

      const termWidth = process.stdout.columns;

      if (description === null) {
        description = 'No Description';
      }

      const limit = termWidth - name.length;

      return {
        title: `${name} - ${stargazers.totalCount} stars - ${truncate(
          description,
          limit - 20,
          '...',
        )}`,
        value: {
          id,
          repo: name,
          owner: username,
        },
      };
    });

    let selection = await prompts({
      type: 'autocomplete',
      name: `repository`,
      message: `Select ${username}'s repository to fork or start typing to search`,
      choices: [...reposList],
    });

    const fork = await forkRepo(selection);

    process.stdout.write(`Cloning into ${cloneUrl}`);

    const cloneUrl = program.ssh ? fork.data.ssh_url : fork.data.clone_url;

    await cloneRepo(cloneUrl);
  } catch (error) {
    process.stderr.write(
      'Unable to fork repository, check params and try again \n',
      error,
    );

    process.exit(1);
  }
};

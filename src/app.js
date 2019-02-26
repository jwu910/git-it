import path from 'path';
import program from 'commander';
import prompts from 'prompts';
import updateNotifier from 'update-notifier';

import { cloneRepo } from './api/cloneRepo';
import { forkRepo } from './api/forkRepo';
import { getRepos } from './api/getRepos';
import { truncate } from './util/truncate';
import { exists } from 'fs';

const pkg = require(path.resolve(__dirname, '../package.json'));
const notifier = updateNotifier({
  pkg,
});

if (notifier.update) {
  notifier.notify();
}

function reposListFromRepos(repos, username) {
  return repos.map(({ node }) => {
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
}

export const start = async () => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .option('-s --ssh', 'Use SSH url to clone')
    .parse(process.argv);

  const username = program.user;

  // Prompt for username if none provided
  if (!username) {
    process.stderr.write.error(
      `Use option -u or --user to search repositories by Github use
          \nUsage: git-started -u jwu910`.trim(),
    );

    return;
  }

  getRepos(username)
    .then(function(response) {
      const user = response.user;
      if (!user) {
        return new Error('user not found.');
      }

      const repositories = user.repositories.edges;
      if (!repositories.length) {
        return new Error('no repositories found.');
      }

      return Promise.resolve(reposListFromRepos(repositories, username));
    })
    .then(reposList =>
      prompts({
        type: 'autocomplete',
        name: `repository`,
        message: `Select ${username}'s repository to fork or start typing to search`,
        choices: [...reposList],
      }),
    )
    .then(function(chosenRepo) {
      if (!chosenRepo.repository) {
        process.stdout.write('Repository not found.');
        process.exit(0);
      }

      return Promise.resolve(chosenRepo);
    })
    .then(selection => forkRepo(selection))
    .then(function(fork) {
      const cloneUrl = program.ssh ? fork.data.ssh_url : fork.data.clone_url;
      return cloneRepo(cloneUrl);
    })
    .then(() => process.stdout.write('Done.'))
    .catch(function(err) {
      console.log(err);
      process.stderr.write(`Error: ${err.message}`);
    });
};

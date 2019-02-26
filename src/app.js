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

// Extracts repository info from GraphQL edge nodes
function reposListFromGraphEdges(edges, username) {
  return edges.map(({ node }) => {
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
    .catch(function() {
      // Need special error handling because
      // the GitHub API returns an ugly error message.
      process.stderr.write(`Could not get user ${username}.`);
      process.exit(1);
    })
    .then(function(response) {
      // Check user & repo, then get list from graphQL edges
      const user = response.user;
      if (!user) {
        return new Error('user not found.');
      }

      const edges = user.repositories.edges;
      if (!edges.length) {
        return new Error('no repositories found.');
      }

      return Promise.resolve(reposListFromGraphEdges(edges, username));
    })
    .then((
      reposList, // Prompt user to choose a repo
    ) =>
      prompts({
        type: 'autocomplete',
        name: `repository`,
        message: `Select ${username}'s repository to fork or start typing to search`,
        choices: [...reposList],
      }),
    )
    .then(function(chosenRepo) {
      // Check that the chosen repo exists
      if (!chosenRepo.repository) {
        process.stdout.write('Repository not found.');
        process.exit(0);
      }

      return Promise.resolve(chosenRepo);
    })
    .then(selection => forkRepo(selection)) // Fork the repo
    .then(function(fork) {
      // Clone the repo, either by SSH or HTTP
      return cloneRepo(program.ssh ? fork.data.ssh_url : fork.data.clone_url);
    })
    .then(() => process.stdout.write('Done.\n')) // Print out confirmation message
    .catch(function(err) {
      // Catch-and-print general error case
      process.stderr.write(`Error: ${err.message}`);
    });
};

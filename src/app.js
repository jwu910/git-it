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
    process.stderr.write(
      `Use option -u or --user to search repositories by Github use
      \nUsage: git-started -u jwu910`.trim(),
    );

    return;
  }

  try {
    var userGraph = await getRepos(username);
  } catch (err) {
    // This error message from the GitHub API is especially ugly.
    process.stderr.write(`Error: could not get user ${username}.\n`);
    process.exit(1);
  }

  try {
    // Check user & repo
    const user = userGraph.user;
    if (!user) {
      throw new Error('user not found.');
    }

    const edges = user.repositories.edges;
    if (!edges.length) {
      throw new Error('no repositories found.');
    }

    // Get list from graphQL edges
    const reposList = reposListFromGraphEdges(edges, username);

    // Prompt user to choose a repo
    const chosenRepo = await prompts({
      type: 'autocomplete',
      name: `repository`,
      message: `Select ${username}'s repository to fork or start typing to search`,
      choices: [...reposList],
    });

    // Check that the repo chosen by prompt exists
    if (!chosenRepo.repository) {
      throw new Error('repository not found.');
    }

    const fork = await forkRepo(chosenRepo);
    await cloneRepo(program.ssh ? fork.data.ssh_url : fork.data.clone_url);
    process.stdout.write(`Successfully forked and cloned repo.\n`);
  } catch (err) {
    // Catch-and-print general error case
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
};

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

async function getReposList(username) {
  try {
    const userGraph = await getRepos(username);
    return reposListFromGraphEdges(userGraph.user.repositories.edges, username);
  } catch (response) {
    for (let i in response.response.errors) {
      process.stderr.write(
        `ERR_${response.response.errors[i].type}: ${
          response.response.errors[i].message
        }\n`,
      );
    }
    process.exit(1);
  }
}

export const start = async () => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .option('-s --ssh', 'Use SSH url to clone')
    .parse(process.argv);

  const username = program.user;

  if (!username) {
    process.stderr.write(
      `Use option -u or --user to search repositories by Github user
      \nUsage: git-started -u jwu910`.trim(),
    );

    return;
  }

  try {
    const reposList = await getReposList(username);

    const chosenRepo = await prompts({
      type: 'autocomplete',
      name: `repository`,
      message: `Select ${username}'s repository to fork or start typing to search`,
      choices: [...reposList],
    });

    if (!chosenRepo.repository) {
      throw new Error('repository not found.');
    }

    const fork = await forkRepo(chosenRepo);
    await cloneRepo(program.ssh ? fork.data.ssh_url : fork.data.clone_url);
    process.stdout.write(`Successfully forked and cloned repo.\n`);
  } catch (err) {
    process.stderr.write(`ERROR: ${err.message}\n`);
    process.exit(1);
  }
};

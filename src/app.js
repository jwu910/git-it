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

export const start = async () => {
  program
    .version(pkg.version, '-v, --version')
    .option('-u, --user <username>', 'Query User')
    .option('-s --ssh', 'Use SSH url to clone')
    .parse(process.argv);

  const username = program.user;

  //TODO: prompt for username if none provided
  if (!username) {
    console.error(
      `Use option -u or --user to search repositories by Github user
      \nUsage: git-started -u jwu910`.trim(),
    );

    return;
  }

  let userGraph;
  try {
    userGraph = await getRepos(username);
  } catch (error) {
    console.error('Error getting repositories.');
    error.response.errors.forEach(err =>
      console.error(`ERR_${err.type}: ${err.message}`),
    );

    return;
  }

  const reposList = userGraph.user.repositories.edges.map(({ node }) => {
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

  const selection = await prompts({
    type: 'autocomplete',
    name: 'repository',
    message: `Select ${username}'s repository to fork or start typing to search`,
    choices: [...reposList],
  });

  if (!selection.repository) {
    console.error('Error: Repository not found.');

    return;
  }

  const selectionRepo = `${selection.repository.owner}/${
    selection.repository.repo
  }`;

  let fork;
  try {
    fork = await forkRepo(selection);

    console.log(`Successfully forked ${selectionRepo}.`);
  } catch (error) {
    console.error(`Error forking ${selectionRepo}.`);
    console.error(`Message: ${error}`);

    return;
  }

  try {
    await cloneRepo(program.ssh ? fork.data.ssh_url : fork.data.clone_url);

    console.log(`Successfully cloned ${selectionRepo}.`);
  } catch (error) {
    console.error(`Error cloning ${selectionRepo}.`);
    console.error(`Message: ${error}`);

    return;
  }
};

import { spawn } from 'child_process';

import auth from '../auth';

let gitResponse;

/**
 * Execute git command with passed arguments.
 * <args> is expected to be an array of strings.
 * Example: ['fetch', '-pv']
 */
const execGit = args => {
  return new Promise((resolve, reject) => {
    let dataString = '';
    let errorString = '';

    gitResponse = spawn('git', args);

    gitResponse.stdout.setEncoding('utf8');
    gitResponse.stderr.setEncoding('utf8');

    gitResponse.stdout.on('data', data => (dataString += data));
    gitResponse.stderr.on('data', data => (errorString += data));

    gitResponse.on('exit', (code, signal) => {
      if (code === 0) {
        resolve(dataString.toString());
      } else if (signal === 'SIGTERM') {
        reject(signal);
      } else {
        reject(errorString.toString());
      }
    });
  });
};

export const cloneRepo = url => {
  const args = ['clone', url, '-v'];
  return execGit(args);
};

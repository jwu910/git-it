import axios from 'axios';

import auth from '../auth';

export const forkRepo = async ({ repository: { owner, repo } }) => {
  try {
    const baseUrl = `https://api.github.com`;
    const endpoint = `/repos/${owner}/${repo}/forks`;

    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${auth.github.token}`,
      },
      url: baseUrl + endpoint,
    };

    const res = await axios(options);

    return res;
  } catch (error) {
    return 'Error: ', error;
  }
};

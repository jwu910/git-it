import client from './client';

export const getRepos = async username => {
  try {
    const res = await client.request(
      `{
        user(login: "${username}") {
          name
          repositories(first:100 orderBy:{field: STARGAZERS, direction: DESC}) {
            edges {
              node {
                id
                name
                forks {
                  totalCount
                }
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
      }`,
    );

    return res;
  } catch (error) {
    return 'Error: ', error;
  }
};

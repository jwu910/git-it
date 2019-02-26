import client from './client';

export const getRepos = async username => {
  const query = `{
      user(login: "${username}") {
        name
        repositories(first:100 orderBy:{field: STARGAZERS, direction: DESC}) {
          edges {
            node {
              id
              name
              description
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
    }`;

  process.stdout.write('Getting repos list...\n');
  return client.request(query);
};

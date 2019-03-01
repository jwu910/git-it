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

  try {
    return await client.request(query);
  } catch (e) {
    throw new Error(e.response.errors[0].message);
  }
};

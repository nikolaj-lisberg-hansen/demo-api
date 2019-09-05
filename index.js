// https://www.apollographql.com/docs/apollo-server/getting-started/
// https://www.apollographql.com/docs/apollo-server/essentials/schema/
// https://www.apollographql.com/docs/apollo-server/features/authentication/
const { ApolloServer, gql } = require('apollo-server');
// const bodyParser = require('body-parser');
// not needed in ApolloServer v2 if HTTP header Content-Type: application/json; charset=utf-8
const uuidv4 = require('uuid/v4');

/*
    # Test data for GrapQL queries like:

    movies {
      title
      year
      rating
      actors {
        name
        birthday
        country
        directors {
          name
          birthday
          country
        }
      }
    }

*/

let movies = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    year: 2001,
    rating: 3,
    actors: [
      {
        name: 'Big Ben',
        birthday: '1975',
        country: 'England',
        directors: [
          {
            name: 'John Heart',
            birthday: '1977',
            country: 'USA'
          }
        ]
      }
    ]
  },
  {
    title: 'Jurassic Park',
    year: 1995,
    rating: 2,
    actors: [
      {
        name: 'George T. Owel',
        birthday: '1956',
        country: 'Irland',
        directors: [
          {
            name: 'Ling Dingding',
            birthday: '1988',
            country: 'China'
          }
        ]
      }
    ]
  },
];

/*
    # Test data for GrapQL queries like:

    users {
      username
      password
    }

*/

let users = [
  {
    id: uuidv4(),
    name: 'Anonymous user',
    token: '',
    username: 'anonymous',
    password: '',
  },
  {
    id: uuidv4(),
    name: 'Authenticated user',
    token: '00000000-0000-0000-0000-000000000000',
    username: 'authenticated',
    password: 'test',
  }
]

const typeDefs = gql`

  "Director"
  type Director {
    name: String
    birthday: String
    country: String
  }

  "Actor"
  type Actor {
    name: String
    birthday: String
    country: String
    directors: [Director]
  }

  "Movie"
  type Movie {
    title: String
    year: Int
    rating: Int
    actors: [Actor]
  }

  "User"
  type User {
    id: ID
    name: String
    username: String
    password: String
  }

  "Token"
  type Token {
    token: String
    user: User
  }

  type Query {
    movies: [Movie]
    users: [User]
  }

  type Mutation {
    createUser(username: String, password: String): Token
    login(username: String, password: String): Token
  }
`;

/*
  createUser(username: $username, password: $password) {
    token
    user {
      id
      name
    }
  }
*/
const resolvers = {
  Query: {
    movies: () => movies,
    users: () => users,
  },
  Mutation: {
    createUser: async (_, args, context ) => {
      console.log('ARGS:\n',args);
      console.log('CONTEXT:\n', context);
      const user = {
        id: uuidv4(),
        name: args.username,
        token: uuidv4(),
        username: args.username,
        password: args.password,
      }
      users.push(user);
      console.log('USERS:\n',JSON.stringify(users,null,2));
      return {
        token: user.token,
        user: {
          id: user.id,
          name: user.username
        }
      };
    },
    login: async (_, args, context ) => {
      console.log('ARGS:\n',args);
      console.log('CONTEXT:\n', context);
      const user = users.find(function (user) {
        return (user.username === args.username && user.password === args.password);
      });
      if (user) {
        return {
          token: user.token,
          user: {
            id: user.id,
            name: user.username
          }
        };
      }
      throw new Error("Login failed")
    }
  },

};

/*
const { print } = require('graphql');

class BasicLogging {
  requestDidStart({queryString, parsedQuery, variables}) {
    const query = queryString || print(parsedQuery);
    console.log(query);
    console.log(variables);
  }

  willSendResponse({graphqlResponse}) {
    console.log(JSON.stringify(graphqlResponse, null, 2));
  }
}
*/

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    if (req.body.operationName!=='IntrospectionQuery') {
      console.log(req.body.query);
      console.log(req.body.variables);
    }
     // get the user token from the headers
     const token = req.headers.authorization || '';
     // try to retrieve a user with the token
     const user = users.find(function (user) {
       return user.token === token;
     });
     // if (!user) throw new AuthenticationError('you must be logged in');
     // add the user to the context
     return { user };
   },
// Production logging
// extensions: [() => new BasicLogging()]
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

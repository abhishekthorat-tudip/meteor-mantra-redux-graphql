import {
  apolloServer
} from 'graphql-tools';
import express from 'express';
import proxyMiddleware from 'http-proxy-middleware';
import schema from './data/schema';
import './data/resolvers';
import { resolvers } from './graphql_helpers';

import { check } from 'meteor/check';

const GRAPHQL_PORT = 4000;

const graphQLServer = express();

graphQLServer.use('/graphql', apolloServer(async(req) => {
  let user = null;

  if (req.headers.authorization) {
    const token = req.headers.authorization;
    check(token, String);
    const hashedToken = Accounts._hashLoginToken(token);
    user = await Meteor.users.findOne({
      "services.resume.loginTokens.hashedToken": hashedToken
    });
  }

  return {
    graphiql: true,
    pretty: true,
    schema,
    resolvers: resolvers(),
    context: {
      // The current user will now be available on context.user in all resolvers
      user,
    }
  };
}));

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}`
));

WebApp.rawConnectHandlers.use(proxyMiddleware(`http://localhost:${GRAPHQL_PORT}/graphql`));

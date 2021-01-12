import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import redisConnect from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm';

import { HelloResolver } from './resolvers/hello';
import { UserResolver } from './resolvers/user/user';
import { MyContext } from './types';
import { cookieSession, __prod__ } from './constants';
import { User } from './entities/User';

const main = async () => {
  const app = express();

  // POSTGRES CONNECTION
  await createConnection({
    host: process.env.POSTGRES_HOST,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_NAME,
    type: 'postgres',
    // Log every SQL
    logging: !__prod__,
    // Run migrations everytime the server is restarted
    synchronize: !__prod__,
    // Here you should add your entities everytime you create one 
    // in order to be added to de migrations
    entities: [User],
  });

  // REDIS CONNECTION
  const RedisStore = redisConnect(session);
  const redis = new Redis({
    host: process.env.REDIS_HOST,
  });

  app.use(
    cors({
      // Here you should add your frontend url
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(
    session({
      name: cookieSession,
      store: new RedisStore({
        client: redis,
        disableTTL: true,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: 'lax',
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: process.env.SECRET!,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      // Here you should add your resolvers
      resolvers: [HelloResolver, UserResolver],
      validate: false,
    }),
    // This will make available the context to the resolvers
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: {
      // Disable apollo cors default to use the cors package
      origin: false,
    },
  });

  app.listen(3000, () => {
    console.log(`Server listening on port ${3000}`);
  });
};

main();

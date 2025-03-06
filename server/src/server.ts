import express from 'express';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import db from './config/connection.js';  
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Apply Apollo Server middleware to Express
const startApolloServer = async () => {
  // Start Apollo Server
  await server.start();

  // Middleware for parsing JSON and URL-encoded data
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
  }

  // Apply Apollo Server middleware with authentication context
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        let user = null;
  
        if (token.startsWith('Bearer ')) {
          try {
            user = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET_KEY!);
          } catch (err) {
            const error = err as Error; // Explicitly cast err to Error
            console.error('Invalid token:', error.message);
          }
        }
  
        return { user };
      },
    })
  );

  // Connect to DB and start the server
  db.once('open', () => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}/graphql`)
    );
  });
};

// Start the server
startApolloServer();
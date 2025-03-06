import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url'; // To get current directory in ES Modules
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // Ensure you are importing mongoose
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';

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

  // Get current directory for serving static files (replace __dirname)
  // const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
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
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'your_mongo_uri_here');
    console.log('Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

// Start the server
startApolloServer();
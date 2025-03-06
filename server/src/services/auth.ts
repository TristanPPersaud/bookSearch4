import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Define the JwtPayload interface
interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

// Middleware to authenticate token for GraphQL requests
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // In GraphQL, the authorization header is often passed with the request
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];  // 'Bearer token'

    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err: unknown, user) => {
      if (err) {
        const error = err as Error; // Force TypeScript to treat it as an Error
        console.error('Invalid token:', error.message);
        return res.sendStatus(403);
      }

      // Attach the user data to the request object (this will be available in resolvers)
      req.user = user as JwtPayload;
      return next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

// Function to sign a JWT token
export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};
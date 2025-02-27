import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { config } from '../config';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Authentication required');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret) as { id: string };

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user) {
            throw new ApiError(401, 'User not found');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token',
            });
        } else if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'An unexpected error occurred',
            });
        }
    }
};

// Check if user has admin role
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        if (req.user.role !== 'ADMIN') {
            throw new ApiError(403, 'Admin access required');
        }

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'An unexpected error occurred',
            });
        }
    }
};
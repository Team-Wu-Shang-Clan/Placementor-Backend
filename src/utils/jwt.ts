import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { config } from '../config';

/**
 * Generate JWT token for user
 */
export const generateToken = (user: User): string => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    const secretKey: Secret = config.jwtSecret;
    const options: SignOptions = {
        expiresIn: config.jwtExpiration as any, // This can be either a string like '7d' or a number in seconds
    };

    return jwt.sign(payload, secretKey, options);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
    return jwt.verify(token, config.jwtSecret);
};


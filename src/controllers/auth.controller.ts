import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { authService } from '../services/auth.service';

const register = async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    try {
        const { user, token } = await authService.registerUser({
            email,
            password,
            firstName,
            lastName,
        });

        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully. Please verify your email.',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (error) {
        console.log(error)

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

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const { user, token } = await authService.loginUser(email, password);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            message: 'User logged in successfully',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
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


const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // User is attached to req by isAuthenticated middleware
        const user = req.user as User;

        // Return user data (excluding password)
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            data: {
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'An unexpected error occurred',
        });
    }
};

export const authController = {
    register,
    login,
    getCurrentUser,
};

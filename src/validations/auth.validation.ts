import { z } from 'zod';

const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must be less than 100 characters'),
        firstName: z
            .string()
            .min(2, 'First name must be at least 2 characters')
            .max(50, 'First name must be less than 50 characters'),
        lastName: z
            .string()
            .min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must be less than 50 characters'),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

const resendVerificationSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
    }),
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must be less than 100 characters'),
    }),
});

export const authValidation = {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};

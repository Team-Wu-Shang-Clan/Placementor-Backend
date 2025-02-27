import { Request, Response, NextFunction } from 'express';
import { z, AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: error.errors,
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Internal server error',
                });
            }
        }
    };
};

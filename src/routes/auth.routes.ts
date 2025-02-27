import express from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authValidation } from '../validations/auth.validation';
import { isAuthenticated } from '../middlewares/auth';

const router = express.Router();

router.post(
    '/register',
    validateRequest(authValidation.registerSchema),
    authController.register
);

router.post(
    '/login',
    validateRequest(authValidation.loginSchema),
    authController.login
);

router.get('/me', isAuthenticated, authController.getCurrentUser);

export { router as authRouter };
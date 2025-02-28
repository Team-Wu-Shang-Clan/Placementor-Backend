import express from 'express';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate-request';
import { interviewValidation } from '../validations/interview.validation';
import { interviewController } from '../controllers/interview.controller';

const router = express.Router();

router.post(
    '/templates',
    isAuthenticated,
    // isAdmin,
    validateRequest(interviewValidation
        .createTemplateSchema),
    interviewController.createInterviewTemplate
);

router.get(
    '/templates',
    isAuthenticated,
    interviewController.getAllInterviewTemplates
);

router.get(
    '/templates/:id',
    isAuthenticated,
    validateRequest(interviewValidation.getTemplateSchema),
    interviewController.getInterviewTemplateById
);

router.put(
    '/templates/:id',
    isAuthenticated,
    isAdmin,
    validateRequest(interviewValidation.updateTemplateSchema),
    interviewController.updateInterviewTemplate
);

router.delete(
    '/templates/:id',
    isAuthenticated,
    isAdmin,
    validateRequest(interviewValidation.deleteTemplateSchema),
    interviewController.deleteInterviewTemplate
);

// Mock interview routes
router.post(
    '/schedule',
    isAuthenticated,
    validateRequest(interviewValidation.scheduleInterviewSchema),
    interviewController.scheduleInterview
);

router.get(
    '/',
    isAuthenticated,
    interviewController.getUserInterviews
);

router.get(
    '/:id',
    isAuthenticated,
    validateRequest(interviewValidation.getInterviewSchema),
    interviewController.getInterviewById
);

router.patch(
    '/:id/start',
    isAuthenticated,
    validateRequest(interviewValidation.getInterviewSchema),
    interviewController.startInterview
);

router.patch(
    '/:id/complete',
    isAuthenticated,
    validateRequest(interviewValidation.completeInterviewSchema),
    interviewController.completeInterview
);

router.post(
    '/:id/response',
    isAuthenticated,
    validateRequest(interviewValidation.saveResponseSchema),
    interviewController.saveInterviewResponse
);

router.get(
    '/:id/feedback',
    isAuthenticated,
    validateRequest(interviewValidation.getInterviewSchema),
    interviewController.getInterviewFeedback
);

export { router as interviewRouter };

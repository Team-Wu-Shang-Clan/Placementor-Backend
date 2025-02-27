import express from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate-request';
import { dailyPlanValidation } from '../validations/daily-plan.validation';
import { dailyPlanController } from '../controllers/daily-plan.controller';

const router = express.Router();

// GET /api/daily-plans/:id - Get a specific daily plan
router.get(
  '/:id',
  isAuthenticated,
  validateRequest(dailyPlanValidation.getDailyPlanSchema),
  dailyPlanController.getDailyPlanById
);

// GET /api/learning-plans/:planId/daily-plans - Get all daily plans for a learning plan
router.get(
  '/learning-plan/:planId',
  isAuthenticated,
  validateRequest(dailyPlanValidation.getLearningPlanDailyPlansSchema),
  dailyPlanController.getLearningPlanDailyPlans
);

// PATCH /api/daily-plans/:id/unlock - Unlock a daily plan
router.patch(
  '/:id/unlock',
  isAuthenticated,
  validateRequest(dailyPlanValidation.getDailyPlanSchema),
  dailyPlanController.unlockDailyPlan
);

// PATCH /api/daily-plans/:id/complete - Mark a daily plan as complete
router.patch(
  '/:id/complete',
  isAuthenticated,
  validateRequest(dailyPlanValidation.getDailyPlanSchema),
  dailyPlanController.completeDailyPlan
);

// POST /api/daily-plans/:id/resources - Assign resources to a daily plan
router.post(
  '/:id/resources',
  isAuthenticated,
  validateRequest(dailyPlanValidation.assignResourcesSchema),
  dailyPlanController.assignResourcesToDailyPlan
);

// GET /api/daily-plans/:id/recommended-resources - Get recommended resources for a daily plan
router.get(
  '/:id/recommended-resources',
  isAuthenticated,
  validateRequest(dailyPlanValidation.getDailyPlanSchema),
  dailyPlanController.getRecommendedResources
);

// POST /api/daily-plans/:id/quiz - Add a quiz to a daily plan
router.post(
  '/:id/quiz',
  isAuthenticated,
  validateRequest(dailyPlanValidation.addQuizSchema),
  dailyPlanController.addQuizToDailyPlan
);

// POST /api/daily-plans/:id/interview - Add a mock interview to a daily plan
router.post(
  '/:id/interview',
  isAuthenticated,
  validateRequest(dailyPlanValidation.addInterviewSchema),
  dailyPlanController.addInterviewToDailyPlan
);

export { router as dailyPlanRouter };
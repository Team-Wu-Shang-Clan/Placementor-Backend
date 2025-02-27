import express from 'express';
import { learningPlanController } from '../controllers/learning-plan.controller';
import { learningPlanValidation } from '../validations/learning-plan.validation';
import { validateRequest } from '../middlewares/validate-request';
import { isAuthenticated } from '../middlewares/auth';

const router = express.Router();

// POST /api/learning-plans - Create a new learning plan
router.post(
  '/',
  isAuthenticated,
  validateRequest(learningPlanValidation.createLearningPlanSchema),
  learningPlanController.createLearningPlan
);

// GET /api/learning-plans - Get all learning plans for current user
router.get(
  '/',
  isAuthenticated,
  learningPlanController.getUserLearningPlans
);

// GET /api/learning-plans/:id - Get a specific learning plan
router.get(
  '/:id',
  isAuthenticated,
  validateRequest(learningPlanValidation.getLearningPlanSchema),
  learningPlanController.getLearningPlanById
);

// PUT /api/learning-plans/:id - Update a learning plan
router.put(
  '/:id',
  isAuthenticated,
  validateRequest(learningPlanValidation.updateLearningPlanSchema),
  learningPlanController.updateLearningPlan
);

// DELETE /api/learning-plans/:id - Delete a learning plan
router.delete(
  '/:id',
  isAuthenticated,
  validateRequest(learningPlanValidation.deleteLearningPlanSchema),
  learningPlanController.deleteLearningPlan
);

// PATCH /api/learning-plans/:id/progress - Update learning plan progress
router.patch(
  '/:id/progress',
  isAuthenticated,
  validateRequest(learningPlanValidation.updateProgressSchema),
  learningPlanController.updateProgress
);

// GET /api/learning-plans/:id/stats - Get learning plan statistics
router.get(
  '/:id/stats',
  isAuthenticated,
  validateRequest(learningPlanValidation.getLearningPlanSchema),
  learningPlanController.getLearningPlanStats
);

export { router as learningPlanRouter };
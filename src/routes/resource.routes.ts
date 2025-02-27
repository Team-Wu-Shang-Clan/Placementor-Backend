import express from 'express';
import { isAdmin, isAuthenticated } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate-request';
import { resourceValidation } from '../validations/resource.validation';
import { resourceController } from '../controllers/resource.controller';

const router = express.Router();

// POST /api/resources - Create a new resource (admin only)
router.post(
  '/',
  isAuthenticated,
//   isAdmin,
  validateRequest(resourceValidation.createResourceSchema),
  resourceController.createResource
);

// GET /api/resources - Get all resources
router.get(
  '/',
  isAuthenticated,
  resourceController.getAllResources
);

// GET /api/resources/:id - Get a specific resource
router.get(
  '/:id',
  isAuthenticated,
  validateRequest(resourceValidation.getResourceSchema),
  resourceController.getResourceById
);

// PUT /api/resources/:id - Update a resource (admin only)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  validateRequest(resourceValidation.updateResourceSchema),
  resourceController.updateResource
);

// DELETE /api/resources/:id - Delete a resource (admin only)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  validateRequest(resourceValidation.deleteResourceSchema),
  resourceController.deleteResource
);

// POST /api/resources/:id/complete - Mark a resource as completed by user
router.post(
  '/:id/complete',
  isAuthenticated,
  validateRequest(resourceValidation.completeResourceSchema),
  resourceController.completeResource
);

// GET /api/resources/completed - Get all completed resources by current user
router.get(
  '/completed',
  isAuthenticated,
  resourceController.getCompletedResources
);

export { router as resourceRouter };
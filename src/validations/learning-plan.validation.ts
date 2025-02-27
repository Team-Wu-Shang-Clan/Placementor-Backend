import { z } from 'zod';
import { Track } from '@prisma/client';

// Create learning plan validation schema
const createLearningPlanSchema = z.object({
  body: z.object({
    track: z.nativeEnum(Track, { errorMap: () => ({ message: 'Invalid track' }) }),
    durationDays: z.number().int().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days')
  })
});

// Get learning plan validation schema
const getLearningPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid learning plan ID format')
  })
});

// Update learning plan validation schema
const updateLearningPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid learning plan ID format')
  }),
  body: z.object({
    track: z.nativeEnum(Track, { errorMap: () => ({ message: 'Invalid track' }) }).optional(),
    durationDays: z.number().int().min(1, 'Duration must be at least 1 day').max(90, 'Duration cannot exceed 90 days').optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be updated'
  })
});

// Delete learning plan validation schema
const deleteLearningPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid learning plan ID format')
  })
});

// Update progress validation schema
const updateProgressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid learning plan ID format')
  }),
  body: z.object({
    currentDay: z.number().int().min(1, 'Current day must be at least 1').optional(),
    progress: z.number().min(0, 'Progress cannot be negative').max(100, 'Progress cannot exceed 100%').optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be updated'
  })
});

export const learningPlanValidation = {
  createLearningPlanSchema,
  getLearningPlanSchema,
  updateLearningPlanSchema,
  deleteLearningPlanSchema,
  updateProgressSchema
};

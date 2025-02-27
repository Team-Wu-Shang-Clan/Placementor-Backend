import { z } from 'zod';
import { ResourceType, Difficulty } from '@prisma/client';

// Create resource validation schema
const createResourceSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.nativeEnum(ResourceType, { errorMap: () => ({ message: 'Invalid resource type' }) }),
    url: z.string().url('Invalid URL format'),
    duration: z.number().optional(),
    difficulty: z.nativeEnum(Difficulty, { errorMap: () => ({ message: 'Invalid difficulty level' }) }).optional(),
  }),
});

// Get resource by ID validation schema
const getResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
});

// Update resource validation schema
const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    type: z.nativeEnum(ResourceType, { errorMap: () => ({ message: 'Invalid resource type' }) }).optional(),
    url: z.string().url('Invalid URL format').optional(),
    duration: z.number().optional(),
    difficulty: z.nativeEnum(Difficulty, { errorMap: () => ({ message: 'Invalid difficulty level' }) }).optional(),
  }),
});

// Delete resource validation schema
const deleteResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
});

// Complete resource validation schema
const completeResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
});

export const resourceValidation = {
  createResourceSchema,
  getResourceSchema,
  updateResourceSchema,
  deleteResourceSchema,
  completeResourceSchema,
};

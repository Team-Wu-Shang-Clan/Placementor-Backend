import { z } from 'zod';
import { QuestionType, InterviewStatus } from '@prisma/client';

// Create interview template validation schema
const createTemplateSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title must be at least 3 characters'),
        description: z.string().optional(),
        duration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(120, 'Duration cannot exceed 120 minutes'),
        questions: z.array(
            z.object({
                question: z.string().min(5, 'Question must be at least 5 characters'),
                type: z.nativeEnum(QuestionType, { errorMap: () => ({ message: 'Invalid question type' }) }),
                codeSnippet: z.string().optional(),
                expectedAnswer: z.string().optional(),
                order: z.number().int().min(1, 'Order must be at least 1')
            })
        ).min(1, 'Template must have at least one question')
    })
});

// Get interview template validation schema
const getTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid template ID format')
    })
});

// Update interview template validation schema
const updateTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid template ID format')
    }),
    body: z.object({
        title: z.string().min(3, 'Title must be at least 3 characters').optional(),
        description: z.string().optional(),
        duration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(120, 'Duration cannot exceed 120 minutes').optional(),
        isActive: z.boolean().optional(),
        questions: z.array(
            z.object({
                id: z.string().uuid('Invalid question ID format').optional(), // Include ID for existing questions
                question: z.string().min(5, 'Question must be at least 5 characters'),
                type: z.nativeEnum(QuestionType, { errorMap: () => ({ message: 'Invalid question type' }) }),
                codeSnippet: z.string().optional(),
                expectedAnswer: z.string().optional(),
                order: z.number().int().min(1, 'Order must be at least 1')
            })
        ).optional()
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be updated'
    })
});

// Delete interview template validation schema
const deleteTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid template ID format')
    })
});

// Schedule interview validation schema
const scheduleInterviewSchema = z.object({
    body: z.object({
        templateId: z.string().uuid('Invalid template ID format'),
        scheduledAt: z.string().refine(val => !isNaN(Date.parse(val)), {
            message: 'Invalid date format'
        })
    })
});

// Get interview validation schema
const getInterviewSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid interview ID format')
    })
});

// Complete interview validation schema
const completeInterviewSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid interview ID format')
    }),
    body: z.object({
        proctorNotes: z.object({}).optional() // Any JSON object for proctoring notes
    })
});

// Save response validation schema
const saveResponseSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid interview ID format')
    }),
    body: z.object({
        questionId: z.string().uuid('Invalid question ID format'),
        userResponse: z.string().min(1, 'Response cannot be empty')
    })
});

export const interviewValidation = {
    createTemplateSchema,
    getTemplateSchema,
    updateTemplateSchema,
    deleteTemplateSchema,
    scheduleInterviewSchema,
    getInterviewSchema,
    completeInterviewSchema,
    saveResponseSchema
};
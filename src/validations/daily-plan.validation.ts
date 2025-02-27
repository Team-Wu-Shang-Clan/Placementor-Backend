import { z } from 'zod';

// Get daily plan validation schema
const getDailyPlanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid daily plan ID format')
  })
});

// Get learning plan daily plans validation schema
const getLearningPlanDailyPlansSchema = z.object({
  params: z.object({
    planId: z.string().uuid('Invalid learning plan ID format')
  })
});

// Assign resources validation schema
const assignResourcesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid daily plan ID format')
  }),
  body: z.object({
    learningResourceIds: z.array(z.string().uuid('Invalid resource ID format')),
    practiceResourceIds: z.array(z.string().uuid('Invalid resource ID format'))
  })
});

// Add quiz validation schema
const addQuizSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid daily plan ID format')
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    questions: z.array(
      z.object({
        question: z.string().min(5, 'Question must be at least 5 characters'),
        options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'Must have at least 2 options'),
        correctAnswer: z.string().min(1, 'Correct answer cannot be empty'),
        explanation: z.string().optional()
      })
    ).min(1, 'Quiz must have at least one question')
  })
});

// Add interview validation schema
const addInterviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid daily plan ID format')
  }),
  body: z.object({
    interviewTemplateId: z.string().uuid('Invalid interview template ID format')
  })
});

export const dailyPlanValidation = {
  getDailyPlanSchema,
  getLearningPlanDailyPlansSchema,
  assignResourcesSchema,
  addQuizSchema,
  addInterviewSchema
};

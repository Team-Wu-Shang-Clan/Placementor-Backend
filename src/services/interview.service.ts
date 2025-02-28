
import { PrismaClient, InterviewTemplate, QuestionType, InterviewStatus, MockInterview, InterviewResponse } from '@prisma/client';
import { ApiError } from '../utils/api-error';

const prisma = new PrismaClient();

/**
 * Create a new interview template with questions
 */
const createInterviewTemplate = async (data: {
    title: string;
    description?: string;
    duration: number;
    questions: Array<{
        question: string;
        type: QuestionType;
        codeSnippet?: string;
        expectedAnswer?: string;
        order: number;
    }>;
}): Promise<InterviewTemplate> => {
    try {
        // Validate input
        if (!data.title) {
            throw new ApiError(400, 'Title is required');
        }

        if (!data.duration || data.duration < 5) {
            throw new ApiError(400, 'Duration must be at least 5 minutes');
        }

        if (!data.questions || data.questions.length === 0) {
            throw new ApiError(400, 'At least one question is required');
        }

        // Create the template with questions in a transaction
        const template = await prisma.$transaction(async (tx) => {
            // Create the template
            const newTemplate = await tx.interviewTemplate.create({
                data: {
                    title: data.title,
                    description: data.description || '',
                    duration: data.duration,
                    isActive: true
                }
            });

            // Create the questions
            await tx.interviewQuestion.createMany({
                data: data.questions.map(q => ({
                    templateId: newTemplate.id,
                    question: q.question,
                    type: q.type,
                    codeSnippet: q.codeSnippet,
                    expectedAnswer: q.expectedAnswer,
                    order: q.order
                }))
            });

            // Return the template with questions
            return await tx.interviewTemplate.findUnique({
                where: { id: newTemplate.id },
                include: {
                    questions: {
                        orderBy: {
                            order: 'asc'
                        }
                    }
                }
            });
        });

        if (!template) {
            throw new ApiError(500, 'Failed to create interview template');
        }

        return template;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error creating interview template');
    }
};

/**
 * Get all interview templates
 */
const getAllInterviewTemplates = async (includeInactive = false): Promise<InterviewTemplate[]> => {
    try {
        const whereClause: any = {};

        // Only include active templates unless specifically requested
        if (!includeInactive) {
            whereClause.isActive = true;
        }

        const templates = await prisma.interviewTemplate.findMany({
            where: whereClause,
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return templates;
    } catch (error) {
        throw new ApiError(500, 'Error fetching interview templates');
    }
};

/**
 * Get an interview template by ID
 */
const getInterviewTemplateById = async (id: string): Promise<InterviewTemplate> => {
    try {
        const template = await prisma.interviewTemplate.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!template) {
            throw new ApiError(404, 'Interview template not found');
        }

        return template;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching interview template');
    }
};

/**
 * Update an interview template
 */
const updateInterviewTemplate = async (
    id: string,
    data: Partial<{
        title: string;
        description: string;
        duration: number;
        isActive: boolean;
        questions: Array<{
            id?: string; // Existing question ID if updating
            question: string;
            type: QuestionType;
            codeSnippet?: string;
            expectedAnswer?: string;
            order: number;
        }>;
    }>
): Promise<InterviewTemplate> => {
    try {
        // Check if template exists
        const existingTemplate = await prisma.interviewTemplate.findUnique({
            where: { id },
            include: {
                questions: true
            }
        });

        if (!existingTemplate) {
            throw new ApiError(404, 'Interview template not found');
        }

        // Start a transaction to handle updating template and questions
        return await prisma.$transaction(async (tx) => {
            // Update template basic info (excluding questions)
            const { questions, ...templateData } = data;

            await tx.interviewTemplate.update({
                where: { id },
                data: templateData
            });

            // Handle questions update if provided
            if (questions && questions.length > 0) {
                // Get existing question IDs
                const existingQuestionIds = existingTemplate.questions.map(q => q.id);

                // Identify questions to update (have IDs) and to create (no IDs)
                const questionsWithIds = questions.filter(q => q.id);
                const questionsWithoutIds = questions.filter(q => !q.id);

                // Get IDs of questions that should be kept
                const questionIdsToKeep = questionsWithIds.map(q => q.id).filter(Boolean) as string[];

                // Delete questions that are no longer needed
                if (questionIdsToKeep.length > 0) {
                    await tx.interviewQuestion.deleteMany({
                        where: {
                            templateId: id,
                            id: {
                                notIn: questionIdsToKeep,
                                in: existingQuestionIds
                            }
                        }
                    });
                } else if (questionIdsToKeep.length === 0 && questionsWithoutIds.length > 0) {
                    // If all questions are being replaced, delete all existing ones
                    await tx.interviewQuestion.deleteMany({
                        where: {
                            templateId: id
                        }
                    });
                }

                // Update existing questions
                for (const question of questionsWithIds) {
                    if (question.id) {
                        await tx.interviewQuestion.update({
                            where: { id: question.id },
                            data: {
                                question: question.question,
                                type: question.type,
                                codeSnippet: question.codeSnippet,
                                expectedAnswer: question.expectedAnswer,
                                order: question.order
                            }
                        });
                    }
                }

                // Create new questions
                if (questionsWithoutIds.length > 0) {
                    await tx.interviewQuestion.createMany({
                        data: questionsWithoutIds.map(q => ({
                            templateId: id,
                            question: q.question,
                            type: q.type,
                            codeSnippet: q.codeSnippet,
                            expectedAnswer: q.expectedAnswer,
                            order: q.order
                        }))
                    });
                }
            }

            // Return updated template with questions
            return await tx.interviewTemplate.findUnique({
                where: { id },
                include: {
                    questions: {
                        orderBy: {
                            order: 'asc'
                        }
                    }
                }
            }) as InterviewTemplate;
        });
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error updating interview template');
    }
};

/**
 * Delete an interview template or mark it as inactive
 */
const deleteInterviewTemplate = async (id: string): Promise<void> => {
    try {
        // Check if template exists
        const existingTemplate = await prisma.interviewTemplate.findUnique({
            where: { id }
        });

        if (!existingTemplate) {
            throw new ApiError(404, 'Interview template not found');
        }

        // Check if template is in use
        const inUseCheck = await checkTemplateInUse(id);

        if (inUseCheck.inUse) {
            // Template is in use, just mark as inactive
            await prisma.interviewTemplate.update({
                where: { id },
                data: {
                    isActive: false
                }
            });

            return;
        }

        // Not in use, can safely delete
        await prisma.$transaction(async (tx) => {
            // Delete all questions first
            await tx.interviewQuestion.deleteMany({
                where: {
                    templateId: id
                }
            });

            // Then delete the template
            await tx.interviewTemplate.delete({
                where: { id }
            });
        });
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error deleting interview template');
    }
};

/**
 * Check if a template is in use
 */
const checkTemplateInUse = async (id: string): Promise<{ inUse: boolean; usageDetails?: any }> => {
    try {
        // Check if it's being used by daily plans
        const dailyPlanUsingTemplate = await prisma.dailyPlan.findFirst({
            where: {
                InterviewTemplate: {
                    id
                }
            }
        });

        // Check if it's being used by interviews
        const interviewsUsingTemplate = await prisma.mockInterview.findFirst({
            where: {
                templateId: id
            }
        });

        const inUse = Boolean(dailyPlanUsingTemplate || interviewsUsingTemplate);

        return {
            inUse,
            usageDetails: inUse ? {
                usedInDailyPlan: Boolean(dailyPlanUsingTemplate),
                usedInInterviews: Boolean(interviewsUsingTemplate)
            } : undefined
        };
    } catch (error) {
        throw new ApiError(500, 'Error checking if template is in use');
    }
};

/**
 * Schedule a new mock interview for a user
 */
const scheduleInterview = async (data: {
    userId: string;
    templateId: string;
    scheduledAt: Date;
}): Promise<MockInterview> => {
    try {
        // Validate input
        if (!data.userId || !data.templateId || !data.scheduledAt) {
            throw new ApiError(400, 'User ID, template ID, and scheduled time are required');
        }

        // Check if template exists and is active
        const template = await prisma.interviewTemplate.findUnique({
            where: {
                id: data.templateId,
                isActive: true
            }
        });

        if (!template) {
            throw new ApiError(404, 'Interview template not found or inactive');
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId }
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Validate scheduled time (must be in the future)
        const now = new Date();
        if (data.scheduledAt <= now) {
            throw new ApiError(400, 'Interview must be scheduled for a future time');
        }

        // Create the mock interview
        const interview = await prisma.mockInterview.create({
            data: {
                userId: data.userId,
                templateId: data.templateId,
                status: InterviewStatus.SCHEDULED,
                scheduledAt: data.scheduledAt,
                isCompleted: false
            },
            include: {
                template: {
                    include: {
                        questions: {
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                }
            }
        });

        return interview;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error scheduling interview');
    }
};

/**
 * Get all interviews for a specific user
 */
const getUserInterviews = async (
    userId: string,
    status?: InterviewStatus,
    options?: {
        page?: number;
        limit?: number;
        includeResponses?: boolean;
    }
): Promise<{
    interviews: MockInterview[];
    total: number;
    page: number;
    totalPages: number;
}> => {
    try {
        // Set up pagination
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        // Build the where clause
        const whereClause: any = { userId };
        if (status) {
            whereClause.status = status;
        }

        // Get total count for pagination
        const total = await prisma.mockInterview.count({
            where: whereClause
        });

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        // Build include object based on options
        const include: any = {
            template: true
        };

        if (options?.includeResponses) {
            include.responses = true;
        }

        // Get the interviews
        const interviews = await prisma.mockInterview.findMany({
            where: whereClause,
            include,
            orderBy: {
                scheduledAt: 'desc'
            },
            skip,
            take: limit
        });

        return {
            interviews,
            total,
            page,
            totalPages
        };
    } catch (error) {
        throw new ApiError(500, 'Error fetching user interviews');
    }
};

/**
 * Get details for a specific interview
 */
const getInterviewById = async (id: string, userId: string): Promise<MockInterview> => {
    try {
        // Get the interview with template and questions
        const interview = await prisma.mockInterview.findUnique({
            where: { id },
            include: {
                template: {
                    include: {
                        questions: {
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                },
                responses: true
            }
        });

        if (!interview) {
            throw new ApiError(404, 'Interview not found');
        }

        // Check if the user has permission to view this interview
        if (interview.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to view this interview');
        }

        return interview;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching interview details');
    }
};

/**
 * Begin an interview session
 */
const startInterview = async (id: string, userId: string): Promise<MockInterview> => {
    try {
        // Get the interview
        const interview = await prisma.mockInterview.findUnique({
            where: { id }
        });

        if (!interview) {
            throw new ApiError(404, 'Interview not found');
        }

        // Check if the user has permission
        if (interview.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to start this interview');
        }

        // Check if the interview is in a valid state to start
        if (interview.status !== InterviewStatus.SCHEDULED) {
            throw new ApiError(400, `Cannot start interview with status: ${interview.status}`);
        }

        // Update the interview status
        const updatedInterview = await prisma.mockInterview.update({
            where: { id },
            data: {
                status: InterviewStatus.IN_PROGRESS,
                startedAt: new Date()
            },
            include: {
                template: {
                    include: {
                        questions: {
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                }
            }
        });

        return updatedInterview;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error starting interview');
    }
};

/**
 * Mark an interview as completed
 */
const completeInterview = async (
    id: string,
    userId: string,
    proctorNotes?: any
): Promise<MockInterview> => {
    try {
        // Get the interview with responses
        const interview = await prisma.mockInterview.findUnique({
            where: { id },
            include: {
                template: {
                    include: {
                        questions: true
                    }
                },
                responses: true
            }
        });

        if (!interview) {
            throw new ApiError(404, 'Interview not found');
        }

        // Check if the user has permission
        if (interview.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to complete this interview');
        }

        // Check if the interview is in progress
        if (interview.status !== InterviewStatus.IN_PROGRESS) {
            throw new ApiError(400, `Cannot complete interview with status: ${interview.status}`);
        }

        // Check if all questions have been answered
        const questionIds = interview.template.questions.map(q => q.id);
        const answeredQuestionIds = interview.responses.map(r => r.questionId);

        const missingQuestions = questionIds.filter(qId => !answeredQuestionIds.includes(qId));

        if (missingQuestions.length > 0) {
            // Find the first few missing question texts for the error message
            const missingQuestionTexts = await prisma.interviewQuestion.findMany({
                where: {
                    id: {
                        in: missingQuestions.slice(0, 3) // Get first 3 for the error message
                    }
                },
                select: {
                    question: true
                }
            });

            const questionList = missingQuestionTexts.map(q => `"${q.question}"`).join(', ');
            const additionalCount = missingQuestions.length > 3 ? ` and ${missingQuestions.length - 3} more` : '';

            throw new ApiError(400, `Cannot complete interview: missing answers for questions ${questionList}${additionalCount}`);
        }

        // Generate feedback and score (this would be more sophisticated in production)
        const { feedback, overallScore } = await generateInterviewFeedback(interview);

        // Update the interview as completed
        const completedInterview = await prisma.mockInterview.update({
            where: { id },
            data: {
                status: InterviewStatus.COMPLETED,
                isCompleted: true,
                completedAt: new Date(),
                feedback,
                overallScore,
                proctorNotes: proctorNotes || null
            },
            include: {
                template: true,
                responses: true
            }
        });

        return completedInterview;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error completing interview');
    }
};

/**
 * Generate feedback and scoring for an interview
 * This is a placeholder - in a real app, this might involve AI/ML
 */
const generateInterviewFeedback = async (interview: any): Promise<{ feedback: any; overallScore: number }> => {
    try {
        // This is a simplified placeholder implementation
        // In a real application, this would involve more sophisticated analysis

        let totalScore = 0;
        const responseAnalysis = [];

        // Analyze each response
        for (const response of interview.responses) {
            // Find the question this response belongs to
            const question = interview.template.questions.find((q: any) => q.id === response.questionId);

            if (!question) continue;

            // Simple scoring algorithm (placeholder)
            let score = 0;
            let feedback = '';

            // Very basic scoring logic based on response length and question type
            if (question.type === 'VERBAL') {
                if (response.userResponse.length > 300) {
                    score = 5; // Excellent
                    feedback = 'Excellent detailed response with good depth.';
                } else if (response.userResponse.length > 150) {
                    score = 4; // Good
                    feedback = 'Good response with adequate detail.';
                } else if (response.userResponse.length > 80) {
                    score = 3; // Average
                    feedback = 'Average response, could use more detail.';
                } else {
                    score = 2; // Needs improvement
                    feedback = 'Response needs more detail and explanation.';
                }
            } else if (question.type === 'CODE') {
                // Basic check for code responses
                const hasCodeStructure = response.userResponse.includes('function') ||
                    response.userResponse.includes('class') ||
                    response.userResponse.includes('for') ||
                    response.userResponse.includes('while');

                if (response.userResponse.length > 200 && hasCodeStructure) {
                    score = 5;
                    feedback = 'Good code solution with proper structure.';
                } else if (hasCodeStructure) {
                    score = 4;
                    feedback = 'Acceptable code solution, could be more thorough.';
                } else {
                    score = 3;
                    feedback = 'Solution lacks proper code structure.';
                }
            } else {
                // Default scoring for other types
                score = 3;
                feedback = 'Standard response.';
            }

            // Update the response with feedback and score
            await prisma.interviewResponse.update({
                where: { id: response.id },
                data: {
                    feedback,
                    score
                }
            });

            // Add to total score
            totalScore += score;

            // Add to response analysis
            responseAnalysis.push({
                questionId: question.id,
                question: question.question,
                score,
                feedback
            });
        }

        // Calculate overall score (scale to 0-100)
        const maxPossibleScore = interview.responses.length * 5; // 5 is max score per question
        const overallScore = Math.round((totalScore / maxPossibleScore) * 100);

        // Generate overall feedback
        let overallFeedback = '';
        if (overallScore >= 90) {
            overallFeedback = 'Excellent interview performance! You demonstrated strong knowledge and communication skills.';
        } else if (overallScore >= 75) {
            overallFeedback = 'Good interview performance. You showed solid understanding of most concepts.';
        } else if (overallScore >= 60) {
            overallFeedback = 'Satisfactory interview performance. There are some areas for improvement.';
        } else {
            overallFeedback = 'This interview indicates several areas where more preparation would be beneficial.';
        }

        // Compile the feedback object
        const feedback = {
            overallFeedback,
            overallScore,
            responseAnalysis,
            strengths: getStrengths(responseAnalysis),
            areasForImprovement: getAreasForImprovement(responseAnalysis)
        };

        return { feedback, overallScore };
    } catch (error) {
        console.error('Error generating feedback:', error);
        // Return basic feedback if the generation fails
        return {
            feedback: {
                overallFeedback: 'Interview completed. Detailed feedback unavailable.',
                responseAnalysis: []
            },
            overallScore: 0
        };
    }
};

/**
 * Identify strengths based on response analysis (helper function)
 */
const getStrengths = (responseAnalysis: any[]): string[] => {
    const strengths = [];

    // Find questions with high scores
    const highScoreResponses = responseAnalysis.filter(r => r.score >= 4);

    if (highScoreResponses.length > 0) {
        strengths.push('Good responses to several questions, particularly: ' +
            highScoreResponses.slice(0, 2).map(r => `"${r.question}"`).join(', '));
    }

    // Basic strength identification
    if (responseAnalysis.length > 0) {
        const avgScore = responseAnalysis.reduce((sum, r) => sum + r.score, 0) / responseAnalysis.length;

        if (avgScore > 3.5) {
            strengths.push('Overall strong communication skills');
        }

        if (responseAnalysis.some(r => r.question.toLowerCase().includes('technical') && r.score >= 4)) {
            strengths.push('Good technical knowledge');
        }
    }

    return strengths.length > 0 ? strengths : ['No specific strengths identified'];
};

/**
 * Identify areas for improvement based on response analysis (helper function)
 */
const getAreasForImprovement = (responseAnalysis: any[]): string[] => {
    const improvements = [];

    // Find questions with low scores
    const lowScoreResponses = responseAnalysis.filter(r => r.score <= 2);

    if (lowScoreResponses.length > 0) {
        improvements.push('Areas to improve include: ' +
            lowScoreResponses.slice(0, 2).map(r => `"${r.question}"`).join(', '));
    }

    // Check if there are code questions with low scores
    const lowCodeResponses = responseAnalysis.filter(
        r => r.question.toLowerCase().includes('code') && r.score < 4
    );

    if (lowCodeResponses.length > 0) {
        improvements.push('Consider practicing more coding problems');
    }

    return improvements.length > 0 ? improvements : ['Keep practicing to maintain your skills'];
};


/**
 * Save a user's response to an interview question
 */
const saveInterviewResponse = async (data: {
    mockInterviewId: string;
    userId: string;
    questionId: string;
    userResponse: string;
}): Promise<InterviewResponse> => {
    try {
        // Validate ownership
        await validateUserOwnership(data.mockInterviewId, data.userId);

        // Check interview status
        await checkInterviewStatus(data.mockInterviewId, InterviewStatus.IN_PROGRESS);

        // Validate that the question belongs to the interview
        const questionBelongsToInterview = await prisma.interviewQuestion.findFirst({
            where: {
                id: data.questionId,
                templateId: {
                    equals: (
                        await prisma.mockInterview.findUnique({
                            where: { id: data.mockInterviewId },
                            select: { templateId: true }
                        })
                    )?.templateId
                }
            }
        });

        if (!questionBelongsToInterview) {
            throw new ApiError(400, 'Question does not belong to this interview');
        }

        // Check if a response already exists
        const existingResponse = await prisma.interviewResponse.findFirst({
            where: {
                mockInterviewId: data.mockInterviewId,
                questionId: data.questionId
            }
        });

        let response;

        if (existingResponse) {
            // Update existing response
            response = await prisma.interviewResponse.update({
                where: { id: existingResponse.id },
                data: {
                    userResponse: data.userResponse,
                    updatedAt: new Date(),
                    // If it wasn't completed before, mark it as completed now
                    isComplete: true,
                    completedAt: existingResponse.completedAt || new Date()
                }
            });
        } else {
            // Create new response
            response = await prisma.interviewResponse.create({
                data: {
                    mockInterviewId: data.mockInterviewId,
                    questionId: data.questionId,
                    userResponse: data.userResponse,
                    isComplete: true,
                    startedAt: new Date(),
                    completedAt: new Date()
                }
            });
        }

        return response;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error saving interview response');
    }
};

/**
 * Get feedback after an interview is completed
 */
const getInterviewFeedback = async (interviewId: string, userId: string): Promise<any> => {
    try {
        // Validate ownership
        await validateUserOwnership(interviewId, userId);

        // Get the interview with template and responses
        const interview = await prisma.mockInterview.findUnique({
            where: { id: interviewId },
            include: {
                template: {
                    include: {
                        questions: {
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                },
                responses: {
                    include: {
                        question: true
                    }
                }
            }
        });

        if (!interview) {
            throw new ApiError(404, 'Interview not found');
        }

        // Check if interview is completed
        if (interview.status !== InterviewStatus.COMPLETED) {
            throw new ApiError(400, 'Feedback is only available for completed interviews');
        }

        // If interview is completed but doesn't have feedback, generate it
        if (interview.isCompleted && (!interview.feedback || !interview.overallScore)) {
            const { feedback, overallScore } = await generateFeedback(interview);

            // Update the interview with the feedback
            await prisma.mockInterview.update({
                where: { id: interviewId },
                data: {
                    feedback,
                    overallScore
                }
            });

            return {
                overallScore,
                feedback,
                responses: interview.responses.map(response => ({
                    question: response.question.question,
                    type: response.question.type,
                    response: response.userResponse,
                    feedback: response.feedback,
                    score: response.score
                }))
            };
        }

        // Return the existing feedback
        return {
            overallScore: interview.overallScore,
            feedback: interview.feedback,
            responses: interview.responses.map(response => ({
                question: response.question.question,
                type: response.question.type,
                response: response.userResponse,
                feedback: response.feedback,
                score: response.score
            }))
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching interview feedback');
    }
};

/**
 * Generate feedback and scoring for an interview
 */
const generateFeedback = async (interview: any): Promise<{ feedback: any; overallScore: number }> => {
    try {
        // This is a simplified placeholder implementation
        // In a real application, this would involve more sophisticated analysis

        let totalScore = 0;
        const responseAnalysis = [];

        // Analyze each response
        for (const response of interview.responses) {
            // Find the question this response belongs to
            const question = interview.template.questions.find((q: any) => q.id === response.questionId);

            if (!question) continue;

            // Simple scoring algorithm (placeholder)
            let score = 0;
            let feedback = '';

            // Very basic scoring logic based on response length and question type
            if (question.type === 'VERBAL') {
                if (response.userResponse.length > 300) {
                    score = 5; // Excellent
                    feedback = 'Excellent detailed response with good depth.';
                } else if (response.userResponse.length > 150) {
                    score = 4; // Good
                    feedback = 'Good response with adequate detail.';
                } else if (response.userResponse.length > 80) {
                    score = 3; // Average
                    feedback = 'Average response, could use more detail.';
                } else {
                    score = 2; // Needs improvement
                    feedback = 'Response needs more detail and explanation.';
                }
            } else if (question.type === 'CODE') {
                // Basic check for code responses
                const hasCodeStructure = response.userResponse.includes('function') ||
                    response.userResponse.includes('class') ||
                    response.userResponse.includes('for') ||
                    response.userResponse.includes('while');

                if (response.userResponse.length > 200 && hasCodeStructure) {
                    score = 5;
                    feedback = 'Good code solution with proper structure.';
                } else if (hasCodeStructure) {
                    score = 4;
                    feedback = 'Acceptable code solution, could be more thorough.';
                } else {
                    score = 3;
                    feedback = 'Solution lacks proper code structure.';
                }
            } else {
                // Default scoring for other types
                score = 3;
                feedback = 'Standard response.';
            }

            // Update the response with feedback and score
            await prisma.interviewResponse.update({
                where: { id: response.id },
                data: {
                    feedback,
                    score
                }
            });

            // Add to total score
            totalScore += score;

            // Add to response analysis
            responseAnalysis.push({
                questionId: question.id,
                question: question.question,
                score,
                feedback
            });
        }

        // Calculate overall score (scale to 0-100)
        const maxPossibleScore = interview.responses.length * 5; // 5 is max score per question
        const overallScore = Math.round((totalScore / maxPossibleScore) * 100);

        // Generate overall feedback
        let overallFeedback = '';
        if (overallScore >= 90) {
            overallFeedback = 'Excellent interview performance! You demonstrated strong knowledge and communication skills.';
        } else if (overallScore >= 75) {
            overallFeedback = 'Good interview performance. You showed solid understanding of most concepts.';
        } else if (overallScore >= 60) {
            overallFeedback = 'Satisfactory interview performance. There are some areas for improvement.';
        } else {
            overallFeedback = 'This interview indicates several areas where more preparation would be beneficial.';
        }

        // Compile the feedback object
        const feedback = {
            overallFeedback,
            overallScore,
            responseAnalysis,
            strengths: getStrengths(responseAnalysis),
            areasForImprovement: getAreasForImprovement(responseAnalysis)
        };

        return { feedback, overallScore };
    } catch (error) {
        console.error('Error generating feedback:', error);
        // Return basic feedback if the generation fails
        return {
            feedback: {
                overallFeedback: 'Interview completed. Detailed feedback unavailable.',
                responseAnalysis: []
            },
            overallScore: 0
        };
    }
};

// /**
//  * Identify strengths based on response analysis (helper function)
//  */
// const getStrengths = (responseAnalysis: any[]): string[] => {
//     const strengths = [];

//     // Find questions with high scores
//     const highScoreResponses = responseAnalysis.filter(r => r.score >= 4);

//     if (highScoreResponses.length > 0) {
//         strengths.push('Good responses to several questions, particularly: ' +
//             highScoreResponses.slice(0, 2).map(r => `"${r.question}"`).join(', '));
//     }

//     // Basic strength identification
//     if (responseAnalysis.length > 0) {
//         const avgScore = responseAnalysis.reduce((sum, r) => sum + r.score, 0) / responseAnalysis.length;

//         if (avgScore > 3.5) {
//             strengths.push('Overall strong communication skills');
//         }

//         if (responseAnalysis.some(r => r.question.toLowerCase().includes('technical') && r.score >= 4)) {
//             strengths.push('Good technical knowledge');
//         }
//     }

//     return strengths.length > 0 ? strengths : ['No specific strengths identified'];
// };

// /**
//  * Identify areas for improvement based on response analysis (helper function)
//  */
// const getAreasForImprovement = (responseAnalysis: any[]): string[] => {
//     const improvements = [];

//     // Find questions with low scores
//     const lowScoreResponses = responseAnalysis.filter(r => r.score <= 2);

//     if (lowScoreResponses.length > 0) {
//         improvements.push('Areas to improve include: ' +
//             lowScoreResponses.slice(0, 2).map(r => `"${r.question}"`).join(', '));
//     }

//     // Check if there are code questions with low scores
//     const lowCodeResponses = responseAnalysis.filter(
//         r => r.question.toLowerCase().includes('code') && r.score < 4
//     );

//     if (lowCodeResponses.length > 0) {
//         improvements.push('Consider practicing more coding problems');
//     }

//     return improvements.length > 0 ? improvements : ['Keep practicing to maintain your skills'];
// };

/**
 * Validate that a user owns an interview
 */
const validateUserOwnership = async (interviewId: string, userId: string): Promise<void> => {
    const interview = await prisma.mockInterview.findUnique({
        where: { id: interviewId },
        select: { userId: true }
    });

    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

    if (interview.userId !== userId) {
        throw new ApiError(403, 'You do not have permission to access this interview');
    }
};

/**
 * Check if an interview is in the expected status
 */
const checkInterviewStatus = async (interviewId: string, expectedStatus: InterviewStatus): Promise<void> => {
    const interview = await prisma.mockInterview.findUnique({
        where: { id: interviewId },
        select: { status: true }
    });

    if (!interview) {
        throw new ApiError(404, 'Interview not found');
    }

    if (interview.status !== expectedStatus) {
        throw new ApiError(400, `Interview is in ${interview.status} status. Expected: ${expectedStatus}`);
    }
};

// Export all functions
export const interviewService = {
    createInterviewTemplate,
    getAllInterviewTemplates,
    getInterviewTemplateById,
    updateInterviewTemplate,
    deleteInterviewTemplate,
    scheduleInterview,
    getUserInterviews,
    getInterviewById,
    startInterview,
    completeInterview,

    // New response and feedback functions
    saveInterviewResponse,
    getInterviewFeedback,


    // Utility functions
    validateUserOwnership,
    checkInterviewStatus
};
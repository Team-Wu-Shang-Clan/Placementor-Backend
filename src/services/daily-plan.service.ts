// src/services/daily-plan.service.ts
import { PrismaClient, DailyPlan, Resource, ResourceType, Quiz, MockInterview } from '@prisma/client';
import { ApiError } from '../utils/api-error';

const prisma = new PrismaClient();

/**
 * Get a daily plan by ID
 */
const getDailyPlanById = async (id: string, userId: string): Promise<DailyPlan> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id },
            include: {
                learningPlan: true,
                learningResources: true,
                practiceResources: true,
                quiz: true,
                mockInterview: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        // Check if the daily plan belongs to the user
        if (dailyPlan.learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to access this daily plan');
        }

        return dailyPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching daily plan');
    }
};

/**
 * Get all daily plans for a learning plan
 */
const getLearningPlanDailyPlans = async (learningPlanId: string, userId: string): Promise<DailyPlan[]> => {
    try {
        // First check if the learning plan belongs to the user
        const learningPlan = await prisma.learningPlan.findUnique({
            where: { id: learningPlanId }
        });

        if (!learningPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to access this learning plan');
        }

        // Get all daily plans for the learning plan
        const dailyPlans = await prisma.dailyPlan.findMany({
            where: { learningPlanId },
            include: {
                learningResources: true,
                practiceResources: true,
                quiz: true,
                mockInterview: true
            },
            orderBy: { dayNumber: 'asc' }
        });

        return dailyPlans;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching daily plans');
    }
};

/**
 * Unlock a daily plan
 */
const unlockDailyPlan = async (id: string, userId: string): Promise<DailyPlan> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id },
            include: {
                learningPlan: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        // Check if the daily plan belongs to the user
        if (dailyPlan.learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to update this daily plan');
        }

        // Check if previous day is completed if not day 1
        if (dailyPlan.dayNumber > 1) {
            const previousDay = await prisma.dailyPlan.findFirst({
                where: {
                    learningPlanId: dailyPlan.learningPlanId,
                    dayNumber: dailyPlan.dayNumber - 1
                }
            });

            if (previousDay && !previousDay.isCompleted) {
                throw new ApiError(400, 'Cannot unlock this day until the previous day is completed');
            }
        }

        // Unlock the daily plan
        const updatedDailyPlan = await prisma.dailyPlan.update({
            where: { id },
            data: {
                isUnlocked: true
            },
            include: {
                learningResources: true,
                practiceResources: true,
                quiz: true,
                mockInterview: true
            }
        });

        return updatedDailyPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error unlocking daily plan');
    }
};

/**
 * Mark a daily plan as complete
 */
const completeDailyPlan = async (id: string, userId: string): Promise<DailyPlan> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id },
            include: {
                learningPlan: true,
                learningResources: true,
                practiceResources: true,
                quiz: {
                    include: {
                        attempts: {
                            where: {
                                userId
                            }
                        }
                    }
                },
                mockInterview: {
                    where: {
                        userId
                    }
                }
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        // Check if the daily plan belongs to the user
        if (dailyPlan.learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to update this daily plan');
        }

        // Check if the daily plan is unlocked
        if (!dailyPlan.isUnlocked) {
            throw new ApiError(400, 'Cannot complete a locked daily plan');
        }

        // Check if all required resources are completed
        const learningResourceIds = dailyPlan.learningResources.map(resource => resource.id);
        const practiceResourceIds = dailyPlan.practiceResources.map(resource => resource.id);

        const completedResources = await prisma.userResource.findMany({
            where: {
                userId,
                resourceId: {
                    in: [...learningResourceIds, ...practiceResourceIds]
                }
            }
        });

        const allResourcesCompleted =
            completedResources.length === learningResourceIds.length + practiceResourceIds.length;

        // Check if quiz is completed if there is one
        const quizCompleted = !dailyPlan.quiz || (dailyPlan.quiz.attempts.length > 0 &&
            dailyPlan.quiz.attempts.some(attempt => attempt.isCompleted));

        // Check if mock interview is completed if there is one
        const interviewCompleted = !dailyPlan.mockInterview ||
            (dailyPlan.mockInterview && dailyPlan.mockInterview.isCompleted);

        if (!allResourcesCompleted || !quizCompleted || !interviewCompleted) {
            throw new ApiError(400, 'All resources, quizzes, and interviews must be completed');
        }

        // Update the daily plan as completed
        const updatedDailyPlan = await prisma.$transaction(async (tx) => {
            // Mark the plan as completed
            const completed = await tx.dailyPlan.update({
                where: { id },
                data: {
                    isCompleted: true
                },
                include: {
                    learningResources: true,
                    practiceResources: true,
                    quiz: true,
                    mockInterview: true
                }
            });

            // Unlock the next day if it exists
            if (dailyPlan.dayNumber < dailyPlan.learningPlan.durationDays) {
                const nextDay = await tx.dailyPlan.findFirst({
                    where: {
                        learningPlanId: dailyPlan.learningPlanId,
                        dayNumber: dailyPlan.dayNumber + 1
                    }
                });

                if (nextDay) {
                    await tx.dailyPlan.update({
                        where: { id: nextDay.id },
                        data: {
                            isUnlocked: true
                        }
                    });
                }
            }

            // Update learning plan progress
            const totalDays = dailyPlan.learningPlan.durationDays;
            const completedDaysCount = await tx.dailyPlan.count({
                where: {
                    learningPlanId: dailyPlan.learningPlanId,
                    isCompleted: true
                }
            });

            const progress = Math.round((completedDaysCount / totalDays) * 100);
            const currentDay = Math.min(dailyPlan.dayNumber + 1, totalDays);

            await tx.learningPlan.update({
                where: { id: dailyPlan.learningPlanId },
                data: {
                    progress,
                    currentDay,
                    // If all days are completed, mark the plan as inactive
                    isActive: completedDaysCount < totalDays
                }
            });

            return completed;
        });

        return updatedDailyPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error completing daily plan');
    }
};

/**
 * Assign resources to a daily plan
 */
// AI REQUIRED
const assignResourcesToDailyPlan = async (
    dailyPlanId: string,
    learningResourceIds: string[],
    practiceResourceIds: string[]
): Promise<DailyPlan> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                learningPlan: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }


        // Verify all resource IDs exist
        const allResourceIds = [...learningResourceIds];
        const resources = await prisma.resource.findMany({
            where: {
                id: {
                    in: allResourceIds
                }
            }
        });

        if (resources.length !== allResourceIds.length) {
            throw new ApiError(400, 'One or more resources do not exist');
        }

        // Clear existing resources and assign new ones
        await prisma.$transaction([
            // Clear existing learning resources
            prisma.resource.updateMany({
                where: {
                    learningPlanDayId: dailyPlanId
                },
                data: {
                    learningPlanDayId: null
                }
            }),

            // Clear existing practice resources
            prisma.resource.updateMany({
                where: {
                    practicePlanDayId: dailyPlanId
                },
                data: {
                    practicePlanDayId: null
                }
            }),

            // Assign learning resources
            ...learningResourceIds.map(resourceId =>
                prisma.resource.update({
                    where: { id: resourceId },
                    data: {
                        learningPlanDayId: dailyPlanId
                    }
                })
            ),

            // Assign practice resources
            ...practiceResourceIds.map(resourceId =>
                prisma.resource.update({
                    where: { id: resourceId },
                    data: {
                        practicePlanDayId: dailyPlanId
                    }
                })
            )
        ]);

        // Return updated daily plan
        return await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                learningResources: true,
                practiceResources: true,
                quiz: true,
                mockInterview: true
            }
        }) as DailyPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error assigning resources to daily plan');
    }
};

/**
 * Add a quiz to a daily plan
 */
const addQuizToDailyPlan = async (dailyPlanId: string, quizData: {
    title: string;
    description: string;
    questions: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
        explanation?: string;
    }>;
}): Promise<Quiz> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                quiz: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        if (dailyPlan.quiz) {
            throw new ApiError(400, 'Daily plan already has a quiz');
        }

        // Create the quiz
        const quiz = await prisma.quiz.create({
            data: {
                title: quizData.title,
                description: quizData.description,
                dailyPlanId,
                questions: {
                    create: quizData.questions.map(q => ({
                        question: q.question,
                        options: q.options as any, // JSON array
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation
                    }))
                }
            },
            include: {
                questions: true
            }
        });

        return quiz;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error adding quiz to daily plan');
    }
};

/**
 * Add a mock interview to a daily plan
 */

const addInterviewToDailyPlan = async (dailyPlanId: string, interviewTemplateId: string): Promise<DailyPlan> => {
    try {
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                mockInterview: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        // Check if the interview template exists
        const interviewTemplate = await prisma.interviewTemplate.findUnique({
            where: { id: interviewTemplateId }
        });

        if (!interviewTemplate) {
            throw new ApiError(404, 'Interview template not found');
        }

        // Update the interview template to link it to this daily plan
        await prisma.interviewTemplate.update({
            where: { id: interviewTemplateId },
            data: {
                dailyPlanId
            }
        });

        // Return the updated daily plan
        return await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                learningResources: true,
                practiceResources: true,
                quiz: true,
                mockInterview: true,
                InterviewTemplate: true
            }
        }) as DailyPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error adding interview to daily plan');
    }
};

/**
 * Get recommended resources for a daily plan
 */
const getRecommendedResources = async (
    dailyPlanId: string,
    userId: string
): Promise<{ learningResources: Resource[]; practiceResources: Resource[] }> => {
    try {
        // Get the daily plan with learning plan info
        const dailyPlan = await prisma.dailyPlan.findUnique({
            where: { id: dailyPlanId },
            include: {
                learningPlan: true,
                learningResources: true,
                practiceResources: true
            }
        });

        if (!dailyPlan) {
            throw new ApiError(404, 'Daily plan not found');
        }

        if (dailyPlan.learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to access this daily plan');
        }

        // Get resources already assigned to this user's plans
        const userLearningPlans = await prisma.learningPlan.findMany({
            where: { userId },
            include: {
                dailyPlans: {
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            }
        });

        const alreadyAssignedResourceIds = new Set<string>();

        userLearningPlans.forEach(plan => {
            plan.dailyPlans.forEach(day => {
                day.learningResources.forEach(resource => {
                    alreadyAssignedResourceIds.add(resource.id);
                });
                day.practiceResources.forEach(resource => {
                    alreadyAssignedResourceIds.add(resource.id);
                });
            });
        });

        // Get resources appropriate for the day number and track
        // Adjust difficulty based on day number (later days = harder)
        const track = dailyPlan.learningPlan.track;
        const dayNumber = dailyPlan.dayNumber;
        const totalDays = dailyPlan.learningPlan.durationDays;

        let difficulty;
        if (dayNumber < totalDays * 0.3) {
            difficulty = 'EASY';
        } else if (dayNumber < totalDays * 0.7) {
            difficulty = 'MEDIUM';
        } else {
            difficulty = 'HARD';
        }

        // Get learning resources (videos and blogs)
        const learningResources = await prisma.resource.findMany({
            where: {
                type: {
                    in: ['VIDEO', 'BLOG']
                },
                id: {
                    notIn: Array.from(alreadyAssignedResourceIds)
                }
                // Add more filters based on track, difficulty, etc.
            },
            take: 3 // Recommend 3 learning resources
        });

        // Get practice resources (leetcode problems)
        const practiceResources = await prisma.resource.findMany({
            where: {
                type: 'LEETCODE',
                difficulty: difficulty as any,
                id: {
                    notIn: Array.from(alreadyAssignedResourceIds)
                }
                // Add more filters based on track, difficulty, etc.
            },
            take: 2 // Recommend 2 practice resources
        });

        return {
            learningResources,
            practiceResources
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error getting recommended resources');
    }
};

export const dailyPlanService = {
    getDailyPlanById,
    getLearningPlanDailyPlans,
    unlockDailyPlan,
    completeDailyPlan,
    assignResourcesToDailyPlan,
    addQuizToDailyPlan,
    addInterviewToDailyPlan,
    getRecommendedResources
};
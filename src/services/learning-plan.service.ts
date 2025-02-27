import { PrismaClient, LearningPlan, Track } from '@prisma/client';
import { ApiError } from '../utils/api-error';

const prisma = new PrismaClient();

/**
 * Create a new learning plan with daily plans
 */
const createLearningPlan = async ({
    userId,
    track,
    durationDays
}: {
    userId: string;
    track: Track;
    durationDays: number;
}): Promise<LearningPlan> => {
    try {
        // Calculate end date based on duration
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);

        // Start transaction to create learning plan and daily plans
        const learningPlan = await prisma.$transaction(async (tx) => {
            // Create learning plan
            const newLearningPlan = await tx.learningPlan.create({
                data: {
                    userId,
                    track,
                    durationDays,
                    startDate,
                    endDate,
                    isActive: true,
                    currentDay: 1,
                    progress: 0
                }
            });

            // Create daily plans for each day
            for (let day = 1; day <= durationDays; day++) {
                await tx.dailyPlan.create({
                    data: {
                        learningPlanId: newLearningPlan.id,
                        dayNumber: day,
                        // First day is unlocked, rest are locked
                        isUnlocked: day === 1,
                        isCompleted: false
                    }
                });
            }

            // Fetch the created learning plan with all daily plans
            return await tx.learningPlan.findUnique({
                where: { id: newLearningPlan.id },
                include: {
                    dailyPlans: {
                        orderBy: { dayNumber: 'asc' }
                    }
                }
            });
        });

        if (!learningPlan) {
            throw new ApiError(500, 'Failed to create learning plan');
        }

        // Now populate daily plans with appropriate resources
        await populateDailyPlans(learningPlan.id, track);

        // Return the learning plan with populated daily plans
        return await prisma.learningPlan.findUnique({
            where: { id: learningPlan.id },
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' },
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            }
        }) as LearningPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error creating learning plan');
    }
};

/**
 * Populate daily plans with appropriate resources based on track
 */
const populateDailyPlans = async (learningPlanId: string, track: Track): Promise<void> => {
    try {
        // Get all daily plans for this learning plan
        const dailyPlans = await prisma.dailyPlan.findMany({
            where: { learningPlanId },
            orderBy: { dayNumber: 'asc' }
        });

        // This would be where you assign appropriate resources to each day
        // For now, this is a placeholder implementation

        // You would implement logic here to fetch resources appropriate for the track
        // and assign them to each daily plan

        // Example:
        // for (const dailyPlan of dailyPlans) {
        //   // Get resources for this day and track
        //   // Assign learning resources
        //   // Assign practice resources
        // }

        // In a real implementation, you'd have a more sophisticated algorithm
        // to determine appropriate resources for each day based on track, difficulty, etc.
    } catch (error) {
        console.error('Error populating daily plans:', error);
        throw new ApiError(500, 'Error populating daily plans with resources');
    }
};

/**
 * Get all learning plans for a user
 */
const getUserLearningPlans = async (userId: string, isActive?: boolean): Promise<LearningPlan[]> => {
    try {
        const whereClause: any = { userId };

        if (isActive !== undefined) {
            whereClause.isActive = isActive;
        }

        const learningPlans = await prisma.learningPlan.findMany({
            where: whereClause,
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' },
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return learningPlans;
    } catch (error) {
        throw new ApiError(500, 'Error fetching learning plans');
    }
};

/**
 * Get a learning plan by ID for a specific user
 */
const getLearningPlanById = async (id: string, userId: string): Promise<LearningPlan> => {
    try {
        const learningPlan = await prisma.learningPlan.findUnique({
            where: { id },
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' },
                    include: {
                        learningResources: true,
                        practiceResources: true,
                        quiz: true,
                        mockInterview: true
                    }
                }
            }
        });

        if (!learningPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (learningPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to access this learning plan');
        }

        return learningPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error fetching learning plan');
    }
};

/**
 * Update a learning plan
 */
const updateLearningPlan = async (
    id: string,
    userId: string,
    updateData: Partial<{
        track: Track;
        durationDays: number;
        isActive: boolean;
    }>
): Promise<LearningPlan> => {
    try {
        // Check if learning plan exists and belongs to user
        const existingPlan = await prisma.learningPlan.findUnique({
            where: { id }
        });

        if (!existingPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (existingPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to update this learning plan');
        }

        // If updating durationDays, we need to handle daily plans
        if (updateData.durationDays && updateData.durationDays !== existingPlan.durationDays) {
            // Handle increasing or decreasing duration
            return await handleDurationChange(id, existingPlan.durationDays, updateData.durationDays, updateData);
        }

        // Regular update without duration change
        const updatedLearningPlan = await prisma.learningPlan.update({
            where: { id },
            data: updateData,
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' },
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            }
        });

        return updatedLearningPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error updating learning plan');
    }
};

/**
 * Handle changing the duration of a learning plan
 */
const handleDurationChange = async (
    learningPlanId: string,
    oldDuration: number,
    newDuration: number,
    updateData: any
): Promise<LearningPlan> => {
    try {
        return await prisma.$transaction(async (tx) => {
            // Update the learning plan
            const updatedPlan = await tx.learningPlan.update({
                where: { id: learningPlanId },
                data: {
                    ...updateData,
                    // Update end date based on new duration
                    endDate: new Date(new Date().getTime() + newDuration * 24 * 60 * 60 * 1000)
                }
            });

            if (newDuration > oldDuration) {
                // Add new daily plans
                for (let day = oldDuration + 1; day <= newDuration; day++) {
                    await tx.dailyPlan.create({
                        data: {
                            learningPlanId,
                            dayNumber: day,
                            isUnlocked: false,
                            isCompleted: false
                        }
                    });
                }
            } else if (newDuration < oldDuration) {
                // Remove excess daily plans
                await tx.dailyPlan.deleteMany({
                    where: {
                        learningPlanId,
                        dayNumber: { gt: newDuration }
                    }
                });
            }

            // Return updated learning plan with daily plans
            return await tx.learningPlan.findUnique({
                where: { id: learningPlanId },
                include: {
                    dailyPlans: {
                        orderBy: { dayNumber: 'asc' },
                        include: {
                            learningResources: true,
                            practiceResources: true
                        }
                    }
                }
            }) as LearningPlan;
        });
    } catch (error) {
        throw new ApiError(500, 'Error updating learning plan duration');
    }
};

/**
 * Delete a learning plan
 */
const deleteLearningPlan = async (id: string, userId: string): Promise<void> => {
    try {
        // Check if learning plan exists and belongs to user
        const existingPlan = await prisma.learningPlan.findUnique({
            where: { id }
        });

        if (!existingPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (existingPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to delete this learning plan');
        }

        // Delete the learning plan (cascade delete will handle daily plans)
        await prisma.learningPlan.delete({
            where: { id }
        });
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error deleting learning plan');
    }
};

/**
 * Update learning plan progress
 */
const updateLearningPlanProgress = async (
    id: string,
    userId: string,
    progressData: Partial<{
        currentDay: number;
        progress: number;
    }>
): Promise<LearningPlan> => {
    try {
        // Check if learning plan exists and belongs to user
        const existingPlan = await prisma.learningPlan.findUnique({
            where: { id },
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' }
                }
            }
        });

        if (!existingPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (existingPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to update this learning plan');
        }

        // Validate currentDay is within range if provided
        if (progressData.currentDay !== undefined &&
            (progressData.currentDay < 1 || progressData.currentDay > existingPlan.durationDays)) {
            throw new ApiError(400, `Current day must be between 1 and ${existingPlan.durationDays}`);
        }

        // Update progress and possibly unlock next day
        if (progressData.currentDay && progressData.currentDay > existingPlan.currentDay) {
            // Unlock the corresponding daily plan if moving to a new day
            await unlockDailyPlan(id, progressData.currentDay);
        }

        // Update the learning plan
        const updatedLearningPlan = await prisma.learningPlan.update({
            where: { id },
            data: progressData,
            include: {
                dailyPlans: {
                    orderBy: { dayNumber: 'asc' },
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            }
        });

        return updatedLearningPlan;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error updating learning plan progress');
    }
};

/**
 * Unlock a specific daily plan
 */
const unlockDailyPlan = async (learningPlanId: string, dayNumber: number): Promise<void> => {
    try {
        // Update the daily plan to be unlocked
        await prisma.dailyPlan.updateMany({
            where: {
                learningPlanId,
                dayNumber
            },
            data: {
                isUnlocked: true
            }
        });
    } catch (error) {
        throw new ApiError(500, 'Error unlocking daily plan');
    }
};

/**
 * Get learning plan statistics
 */
const getLearningPlanStats = async (id: string, userId: string): Promise<any> => {
    try {
        // Check if learning plan exists and belongs to user
        const existingPlan = await prisma.learningPlan.findUnique({
            where: { id },
            include: {
                dailyPlans: {
                    include: {
                        learningResources: true,
                        practiceResources: true
                    }
                }
            }
        });

        if (!existingPlan) {
            throw new ApiError(404, 'Learning plan not found');
        }

        if (existingPlan.userId !== userId) {
            throw new ApiError(403, 'You do not have permission to access this learning plan');
        }

        // Calculate statistics
        const totalDays = existingPlan.durationDays;
        const completedDays = existingPlan.dailyPlans.filter(day => day.isCompleted).length;
        const currentDay = existingPlan.currentDay;

        // Count resources by type
        const resources = {
            videos: 0,
            blogs: 0,
            leetcode: 0,
            total: 0
        };

        for (const day of existingPlan.dailyPlans) {
            for (const resource of [...day.learningResources, ...day.practiceResources]) {
                resources.total++;
                if (resource.type === 'VIDEO') resources.videos++;
                if (resource.type === 'BLOG') resources.blogs++;
                if (resource.type === 'LEETCODE') resources.leetcode++;
            }
        }

        // Calculate time remaining
        const today = new Date();
        const endDate = new Date(existingPlan.endDate);
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        // Put together stats object
        const stats = {
            totalDays,
            completedDays,
            currentDay,
            progress: existingPlan.progress,
            daysRemaining,
            resources,
            isActive: existingPlan.isActive,
            startDate: existingPlan.startDate,
            endDate: existingPlan.endDate
        };

        return stats;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Error getting learning plan statistics');
    }
};

export const learningPlanService = {
    createLearningPlan,
    getUserLearningPlans,
    getLearningPlanById,
    updateLearningPlan,
    deleteLearningPlan,
    updateLearningPlanProgress,
    getLearningPlanStats
};
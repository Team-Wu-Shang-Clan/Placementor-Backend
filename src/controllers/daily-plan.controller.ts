import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { dailyPlanService } from '../services/daily-plan.service';

/**
 * Get a daily plan by ID
 */
const getDailyPlanById = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const dailyPlan = await dailyPlanService.getDailyPlanById(id, user.id);

    res.status(200).json({
      status: 'success',
      data: { dailyPlan }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Get all daily plans for a learning plan
 */
const getLearningPlanDailyPlans = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { planId } = req.params;
    
    const dailyPlans = await dailyPlanService.getLearningPlanDailyPlans(planId, user.id);

    res.status(200).json({
      status: 'success',
      data: { dailyPlans }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Unlock a daily plan
 */
const unlockDailyPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const dailyPlan = await dailyPlanService.unlockDailyPlan(id, user.id);

    res.status(200).json({
      status: 'success',
      message: 'Daily plan unlocked successfully',
      data: { dailyPlan }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Mark a daily plan as complete
 */
const completeDailyPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const dailyPlan = await dailyPlanService.completeDailyPlan(id, user.id);

    res.status(200).json({
      status: 'success',
      message: 'Daily plan completed successfully',
      data: { dailyPlan }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Assign resources to a daily plan
 */
const assignResourcesToDailyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { learningResourceIds, practiceResourceIds } = req.body;
    
    const dailyPlan = await dailyPlanService.assignResourcesToDailyPlan(
      id, 
      learningResourceIds, 
      practiceResourceIds
    );

    res.status(200).json({
      status: 'success',
      message: 'Resources assigned successfully',
      data: { dailyPlan }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Get recommended resources for a daily plan
 */
const getRecommendedResources = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const resources = await dailyPlanService.getRecommendedResources(id, user.id);

    res.status(200).json({
      status: 'success',
      data: { resources }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Add a quiz to a daily plan
 */
const addQuizToDailyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quizData = req.body;
    
    const quiz = await dailyPlanService.addQuizToDailyPlan(id, quizData);

    res.status(201).json({
      status: 'success',
      message: 'Quiz added successfully',
      data: { quiz }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

/**
 * Add a mock interview to a daily plan
 */
const addInterviewToDailyPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { interviewTemplateId } = req.body;
    
    const dailyPlan = await dailyPlanService.addInterviewToDailyPlan(id, interviewTemplateId);

    res.status(201).json({
      status: 'success',
      message: 'Interview added successfully',
      data: { dailyPlan }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
};

export const dailyPlanController = {
  getDailyPlanById,
  getLearningPlanDailyPlans,
  unlockDailyPlan,
  completeDailyPlan,
  assignResourcesToDailyPlan,
  getRecommendedResources,
  addQuizToDailyPlan,
  addInterviewToDailyPlan
};
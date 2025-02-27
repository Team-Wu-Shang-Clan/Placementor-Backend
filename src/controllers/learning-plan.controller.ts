import { Request, Response } from 'express';
import { User, Track } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { learningPlanService } from '../services/learning-plan.service';

/**
 * Create a new learning plan
 */
const createLearningPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { track, durationDays } = req.body;
    
    const learningPlan = await learningPlanService.createLearningPlan({
      userId: user.id,
      track,
      durationDays
    });

    res.status(201).json({
      status: 'success',
      message: 'Learning plan created successfully',
      data: { learningPlan }
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
 * Get all learning plans for current user
 */
const getUserLearningPlans = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { status } = req.query;
    
    let isActive: boolean | undefined = undefined;
    
    if (status === 'active') {
      isActive = true;
    } else if (status === 'completed') {
      isActive = false;
    }
    
    const learningPlans = await learningPlanService.getUserLearningPlans(user.id, isActive);

    res.status(200).json({
      status: 'success',
      data: { learningPlans }
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
 * Get learning plan by ID
 */
const getLearningPlanById = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const learningPlan = await learningPlanService.getLearningPlanById(id, user.id);

    res.status(200).json({
      status: 'success',
      data: { learningPlan }
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
 * Update learning plan
 */
const updateLearningPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const updateData = req.body;
    
    const learningPlan = await learningPlanService.updateLearningPlan(id, user.id, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Learning plan updated successfully',
      data: { learningPlan }
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
 * Delete learning plan
 */
const deleteLearningPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    await learningPlanService.deleteLearningPlan(id, user.id);

    res.status(200).json({
      status: 'success',
      message: 'Learning plan deleted successfully'
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
 * Update learning plan progress
 */
const updateProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const { currentDay, progress } = req.body;
    
    const learningPlan = await learningPlanService.updateLearningPlanProgress(
      id, 
      user.id, 
      { currentDay, progress }
    );

    res.status(200).json({
      status: 'success',
      message: 'Progress updated successfully',
      data: { learningPlan }
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
 * Get learning plan statistics
 */
const getLearningPlanStats = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    
    const stats = await learningPlanService.getLearningPlanStats(id, user.id);

    res.status(200).json({
      status: 'success',
      data: { stats }
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

export const learningPlanController = {
  createLearningPlan,
  getUserLearningPlans,
  getLearningPlanById,
  updateLearningPlan,
  deleteLearningPlan,
  updateProgress,
  getLearningPlanStats
};
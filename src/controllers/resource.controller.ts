import { Request, Response } from 'express';
import { Resource, ResourceType, Difficulty, User } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { resourceService } from '../services/resource.service';

/**
 * Create a new resource (admin only)
 */
const createResource = async (req: Request, res: Response) => {
  try {
    const { title, description, type, url, duration, difficulty } = req.body;

    const resource = await resourceService.createResource({
      title,
      description,
      type,
      url,
      duration,
      difficulty,
    });

    res.status(201).json({
      status: 'success',
      message: 'Resource created successfully',
      data: { resource },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Get all resources
 */
const getAllResources = async (req: Request, res: Response) => {
  try {
    const { type, difficulty } = req.query;
    
    const filters: any = {};
    
    if (type) {
      filters.type = type as ResourceType;
    }
    
    if (difficulty) {
      filters.difficulty = difficulty as Difficulty;
    }
    
    const resources = await resourceService.getAllResources(filters);

    res.status(200).json({
      status: 'success',
      data: { resources },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Get a resource by ID
 */
const getResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await resourceService.getResourceById(id);

    res.status(200).json({
      status: 'success',
      data: { resource },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Update a resource (admin only)
 */
const updateResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const resource = await resourceService.updateResource(id, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Resource updated successfully',
      data: { resource },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Delete a resource (admin only)
 */
const deleteResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await resourceService.deleteResource(id);

    res.status(200).json({
      status: 'success',
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Mark a resource as completed by the current user
 */
const completeResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as User;

    await resourceService.completeResource(id, user.id);

    res.status(200).json({
      status: 'success',
      message: 'Resource marked as completed',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

/**
 * Get all resources completed by the current user
 */
const getCompletedResources = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const completedResources = await resourceService.getCompletedResources(user.id);

    res.status(200).json({
      status: 'success',
      data: { completedResources },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

export const resourceController = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  completeResource,
  getCompletedResources,
};
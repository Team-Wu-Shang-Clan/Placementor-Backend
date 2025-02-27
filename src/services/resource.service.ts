// src/services/resource.service.ts
import { PrismaClient, Resource, ResourceType, Difficulty } from '@prisma/client';
import { ApiError } from '../utils/api-error';

const prisma = new PrismaClient();

/**
 * Create a new resource
 */
const createResource = async (data: {
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  duration?: number;
  difficulty?: Difficulty;
}): Promise<Resource> => {
  try {
    const resource = await prisma.resource.create({
      data,
    });

    return resource;
  } catch (error) {
    throw new ApiError(500, 'Error creating resource');
  }
};

/**
 * Get all resources with optional filters
 */
const getAllResources = async (filters: {
  type?: ResourceType;
  difficulty?: Difficulty;
}): Promise<Resource[]> => {
  try {
    const resources = await prisma.resource.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return resources;
  } catch (error) {
    throw new ApiError(500, 'Error fetching resources');
  }
};

/**
 * Get a resource by ID
 */
const getResourceById = async (id: string): Promise<Resource> => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }

    return resource;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error fetching resource');
  }
};

/**
 * Update a resource
 */
const updateResource = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    type: ResourceType;
    url: string;
    duration: number;
    difficulty: Difficulty;
  }>
): Promise<Resource> => {
  try {
    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found');
    }

    // Update resource
    const updatedResource = await prisma.resource.update({
      where: { id },
      data,
    });

    return updatedResource;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error updating resource');
  }
};

/**
 * Delete a resource
 */
const deleteResource = async (id: string): Promise<void> => {
  try {
    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      throw new ApiError(404, 'Resource not found');
    }

    // Delete resource
    await prisma.resource.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error deleting resource');
  }
};

/**
 * Mark a resource as completed by a user
 */
const completeResource = async (resourceId: string, userId: string): Promise<void> => {
  try {
    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }

    // Check if user has already completed this resource
    const existingCompletion = await prisma.userResource.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });

    if (existingCompletion) {
      throw new ApiError(400, 'Resource already marked as completed');
    }

    // Mark resource as completed
    await prisma.userResource.create({
      data: {
        userId,
        resourceId,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error completing resource');
  }
};

/**
 * Get all resources completed by a user
 */
const getCompletedResources = async (userId: string) => {
  try {
    const completedResources = await prisma.userResource.findMany({
      where: {
        userId,
      },
      include: {
        resource: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return completedResources;
  } catch (error) {
    throw new ApiError(500, 'Error fetching completed resources');
  }
};

export const resourceService = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  completeResource,
  getCompletedResources,
};

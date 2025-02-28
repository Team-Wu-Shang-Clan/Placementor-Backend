import { Request, Response } from 'express';
import { User, InterviewStatus } from '@prisma/client';
import { ApiError } from '../utils/api-error';
import { interviewService } from '../services/interview.service';

/**
 * Create a new interview template (admin only)
 */
const createInterviewTemplate = async (req: Request, res: Response) => {
    try {
        const templateData = req.body;

        const template = await interviewService.createInterviewTemplate(templateData);

        res.status(201).json({
            status: 'success',
            message: 'Interview template created successfully',
            data: { template }
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
 * Get all interview templates
 */
const getAllInterviewTemplates = async (req: Request, res: Response) => {
    try {
        const { includeInactive } = req.query;
        const templates = await interviewService.getAllInterviewTemplates(includeInactive === 'true');

        res.status(200).json({
            status: 'success',
            data: { templates }
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
 * Get an interview template by ID
 */
const getInterviewTemplateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const template = await interviewService.getInterviewTemplateById(id);

        res.status(200).json({
            status: 'success',
            data: { template }
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
 * Update an interview template (admin only)
 */
const updateInterviewTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const template = await interviewService.updateInterviewTemplate(id, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Interview template updated successfully',
            data: { template }
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
 * Delete an interview template (admin only)
 */
const deleteInterviewTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await interviewService.deleteInterviewTemplate(id);

        res.status(200).json({
            status: 'success',
            message: 'Interview template deleted successfully'
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
 * Schedule a new mock interview
 */
const scheduleInterview = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { templateId, scheduledAt } = req.body;

        const interview = await interviewService.scheduleInterview({
            userId: user.id,
            templateId,
            scheduledAt: new Date(scheduledAt)
        });

        res.status(201).json({
            status: 'success',
            message: 'Interview scheduled successfully',
            data: { interview }
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
 * Get all interviews for the current user
 */
const getUserInterviews = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { status, page, limit, includeResponses } = req.query;

        let statusFilter: InterviewStatus | undefined = undefined;
        if (status && Object.values(InterviewStatus).includes(status as InterviewStatus)) {
            statusFilter = status as InterviewStatus;
        }

        const pageNumber = page ? parseInt(page as string, 10) : 1;
        const limitNumber = limit ? parseInt(limit as string, 10) : 10;

        const interviews = await interviewService.getUserInterviews(
            user.id,
            statusFilter,
            {
                page: pageNumber,
                limit: limitNumber,
                includeResponses: includeResponses === 'true'
            }
        );

        res.status(200).json({
            status: 'success',
            data: interviews
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
 * Get interview by ID
 */
const getInterviewById = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { id } = req.params;

        const interview = await interviewService.getInterviewById(id, user.id);

        res.status(200).json({
            status: 'success',
            data: { interview }
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
 * Start an interview
 */
const startInterview = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { id } = req.params;

        const interview = await interviewService.startInterview(id, user.id);

        res.status(200).json({
            status: 'success',
            message: 'Interview started successfully',
            data: { interview }
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
 * Complete an interview
 */
const completeInterview = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { id } = req.params;
        const { proctorNotes } = req.body;

        const interview = await interviewService.completeInterview(id, user.id, proctorNotes);

        res.status(200).json({
            status: 'success',
            message: 'Interview completed successfully',
            data: { interview }
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
 * Save response to an interview question
 */
const saveInterviewResponse = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { id } = req.params;
        const { questionId, userResponse } = req.body;

        const response = await interviewService.saveInterviewResponse({
            mockInterviewId: id,
            userId: user.id,
            questionId,
            userResponse
        });

        res.status(201).json({
            status: 'success',
            message: 'Response saved successfully',
            data: { response }
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
 * Get feedback for an interview
 */
const getInterviewFeedback = async (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        const { id } = req.params;

        const feedback = await interviewService.getInterviewFeedback(id, user.id);

        res.status(200).json({
            status: 'success',
            data: { feedback }
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

export const interviewController = {
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
    saveInterviewResponse,
    getInterviewFeedback
};
# Routes
## Authentication Routes

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Authenticate a user and issue JWT
- POST /api/auth/verify-email/:token - Verify user's email with token
- POST /api/auth/reset-password/request - Request password reset email
- POST /api/auth/reset-password/:token - Reset password with token
- GET /api/auth/me - Get current authenticated user's profile

## User Management Routes

- GET /api/users/profile - Get user's profile information
- PUT /api/users/profile - Update user's profile information
- GET /api/users/coins - Get user's coin balance
- POST /api/users/profile-image - Upload profile image

## Learning Plan Routes

- POST /api/learning-plans - Create a new learning plan
- GET /api/learning-plans - Get all learning plans for current user
- GET /api/learning-plans/:id - Get specific learning plan details
- PUT /api/learning-plans/:id - Update learning plan (e.g., change track/duration)
- DELETE /api/learning-plans/:id - Delete a learning plan
- GET /api/learning-plans/:id/progress - Get progress statistics

## Daily Plan Routes

- GET /api/learning-plans/:planId/daily-plans - Get all daily plans for a learning plan
- GET /api/daily-plans/:id - Get specific daily plan details
- PUT /api/daily-plans/:id/unlock - Unlock a daily plan
- PUT /api/daily-plans/:id/complete - Mark daily plan as completed

## Resource Routes

- GET /api/resources - Get all resources (admin only)
- GET /api/resources/:id - Get specific resource details
- POST /api/resources - Create a new resource (admin only)
- PUT /api/resources/:id - Update a resource (admin only)
- DELETE /api/resources/:id - Delete a resource (admin only)
- GET /api/daily-plans/:id/learning-resources - Get learning resources for a daily plan
- GET /api/daily-plans/:id/practice-resources - Get practice resources for a daily plan
- POST /api/resources/:id/complete - Mark a resource as completed

## Quiz Routes

- GET /api/daily-plans/:id/quiz - Get quiz for a specific daily plan
- POST /api/quizzes/:id/attempts - Start a new quiz attempt
- GET /api/quiz-attempts/:id - Get details of a specific quiz attempt
- POST /api/quiz-attempts/:id/questions/:questionId/answer - Submit answer for a quiz question
- POST /api/quiz-attempts/:id/complete - Complete a quiz attempt and calculate score

## Mock Interview Routes

- GET /api/daily-plans/:id/mock-interview - Get mock interview for a specific daily plan
- POST /api/mock-interviews - Schedule a mock interview
- GET /api/mock-interviews - Get all mock interviews for current user
- GET /api/mock-interviews/:id - Get specific mock interview details
- PUT /api/mock-interviews/:id/start - Start a mock interview
- POST /api/mock-interviews/:id/questions/:questionId/answer - Submit answer for interview question
- PUT /api/mock-interviews/:id/complete - Complete a mock interview
- GET /api/mock-interviews/:id/feedback - Get feedback for a completed interview

## Proctoring Routes

- POST /api/mock-interviews/:id/proctor-events - Record proctoring events (tab switch, face detection, etc.)
- GET /api/mock-interviews/:id/proctor-summary - Get summary of proctoring issues

## Achievement Routes

GET /api/achievements - Get all available achievements
GET /api/users/achievements - Get user's achievement progress
GET /api/users/achievements/:id - Get specific achievement details for user

## Support Routes

POST /api/support/questions - Ask a question to the support chatbot
GET /api/support/questions - Get user's question history
GET /api/resources/:id/questions - Get questions related to a specific resource


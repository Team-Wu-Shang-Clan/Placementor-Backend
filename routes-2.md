Based on your schema.prisma file, I'll outline all the route definitions for your backend API following RESTful principles. I'll organize them by domain/entity with appropriate HTTP methods.

Here's the route structure for your application:

## Authentication Routes
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-email
POST /api/auth/resend-verification
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/me
```

## User Routes
```
GET /api/users
GET /api/users/:id
PUT /api/users/:id
PATCH /api/users/profile-image
DELETE /api/users/:id
```

## Learning Plan Routes
```
POST /api/learning-plans
GET /api/learning-plans
GET /api/learning-plans/:id
PUT /api/learning-plans/:id
DELETE /api/learning-plans/:id
PATCH /api/learning-plans/:id/progress
GET /api/learning-plans/:id/stats
```

## Daily Plan Routes
```
GET /api/daily-plans/:id
GET /api/learning-plans/:planId/daily-plans
PATCH /api/daily-plans/:id/unlock
PATCH /api/daily-plans/:id/complete
```

## Resource Routes
```
POST /api/resources (admin)
GET /api/resources
GET /api/resources/:id
PUT /api/resources/:id (admin)
DELETE /api/resources/:id (admin)
POST /api/resources/:id/complete
GET /api/resources/completed
```

## Quiz Routes
```
POST /api/quizzes (admin)
GET /api/quizzes
GET /api/quizzes/:id
PUT /api/quizzes/:id (admin)
DELETE /api/quizzes/:id (admin)
POST /api/quizzes/:id/start
POST /api/quizzes/:id/submit
GET /api/quizzes/:id/results
```

## Quiz Question Routes
```
POST /api/quiz-questions (admin)
GET /api/quizzes/:quizId/questions
PUT /api/quiz-questions/:id (admin)
DELETE /api/quiz-questions/:id (admin)
```

## Mock Interview Routes
```
POST /api/interviews/templates (admin)
GET /api/interviews/templates
GET /api/interviews/templates/:id
PUT /api/interviews/templates/:id (admin)
DELETE /api/interviews/templates/:id (admin)
POST /api/interviews/schedule
GET /api/interviews
GET /api/interviews/:id
PATCH /api/interviews/:id/start
PATCH /api/interviews/:id/complete
POST /api/interviews/:id/response
GET /api/interviews/:id/feedback
```

## Achievement Routes
```
POST /api/achievements (admin)
GET /api/achievements
GET /api/achievements/:id
PUT /api/achievements/:id (admin)
DELETE /api/achievements/:id (admin)
GET /api/users/:userId/achievements
```

## Support Routes
```
POST /api/support
GET /api/support/questions (admin)
GET /api/support/questions/:id
PUT /api/support/questions/:id/answer (admin)
GET /api/support/my-questions
```

## Admin Routes
```
GET /api/admin/stats
GET /api/admin/users
PATCH /api/admin/users/:id/role
```

These routes cover all the main functionality based on your schema. Routes marked with (admin) would require admin-level permissions to access. You may want to implement middleware to check for proper authentication and authorization for these protected routes.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { resourceRouter } from './routes/resource.routes';
import { learningPlanRouter } from './routes/learning-plan.routes';
import { dailyPlanRouter } from './routes/daily-plan.routes';
import { interviewRouter } from './routes/interview.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/resource', resourceRouter);
app.use('/api/v1/learning-plan', learningPlanRouter);
app.use('/api/v1/daily-plans', dailyPlanRouter); 
app.use('/api/v1/interview', interviewRouter); 

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

export { app };
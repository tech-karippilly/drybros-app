import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

/* -------------------- Global Middlewares -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Health Check -------------------- */
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        service: 'DRybros Backend API'
    });
});

/* -------------------- 404 Handler -------------------- */
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

app.use((
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

export default app;

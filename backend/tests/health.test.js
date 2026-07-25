const request = require('supertest');
const express = require('express');
const { errorHandler, notFound } = require('../middleware/errorMiddleware');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'Server running' });
});

app.use(notFound);
app.use(errorHandler);

describe('GET /api/health', () => {
    it('should return 200 and success: true', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            success: true,
            status: 'Server running'
        });
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toBe(false);
    });
});

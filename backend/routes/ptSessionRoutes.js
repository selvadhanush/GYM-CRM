const express = require('express');
const router = express.Router();
const {
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession
} = require('../controllers/ptSessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getSessions)
    .post(protect, authorize('admin', 'trainer'), createSession);

router.route('/:id')
    .get(protect, authorize('admin', 'receptionist', 'trainer', 'member'), getSessionById)
    .put(protect, authorize('admin', 'trainer'), updateSession)
    .delete(protect, authorize('admin', 'trainer'), deleteSession);

module.exports = router;

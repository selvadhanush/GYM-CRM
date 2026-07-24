const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .post(ticketController.createTicket)
    .get(ticketController.getTickets);

router.route('/:id/reply')
    .post(ticketController.replyToTicket);

router.route('/:id/status')
    .put(ticketController.updateTicketStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { sendEmail, sendWhatsApp } = require('../utils/notificationService');
const logger = require('../lib/logger');

// @desc    Manually trigger the maintenance job (expiry checks) for testing
// @route   GET /api/test/check-expiry
// @access  Public (Dev only)
router.get('/check-expiry', async (req, res) => {
    logger.info('--- Manually Triggering Expiry Checks (TEST) ---');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Auto Update Status (Active -> Expired)
        const expiredResult = await Member.updateMany(
            { status: 'Active', expiryDate: { $lt: today } },
            { status: 'Expired' }
        );

        // 2. Expiry Reminders (7 Days & 1 Day)
        const reminderDates = [7, 1];
        let sentCount = 0;

        for (const days of reminderDates) {
            const targetDateStart = new Date(today);
            targetDateStart.setDate(today.getDate() + days);
            const targetDateEnd = new Date(targetDateStart);
            targetDateEnd.setDate(targetDateStart.getDate() + 1);

            const membersToExpire = await Member.find({
                status: 'Active',
                expiryDate: { $gte: targetDateStart, $lt: targetDateEnd }
            });

            for (const member of membersToExpire) {
                const subject = `Gym Membership Expiry Reminder - ${days} day(s) left!`;
                const messageText = `Hi ${member.name}, your gym membership will expire in ${days} day(s) on ${member.expiryDate.toLocaleDateString()}. Please renew soon!`;

                // Send Email
                if (member.email) {
                    await sendEmail({
                        email: member.email,
                        subject: subject,
                        html: `<p>${messageText}</p>`
                    }).catch(e => logger.error({ err: e }, 'Failed to send expiry reminder email'));
                }

                // Send WhatsApp
                await sendWhatsApp({
                    phone: member.phone,
                    message: messageText
                });

                sentCount++;
            }
        }

        res.json({
            success: true,
            expiredUpdates: expiredResult.modifiedCount,
            remindersSent: sentCount,
            message: 'Manual check completed. Check console for details.'
        });
    } catch (error) {
        logger.error({ err: error }, 'Test script error');
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

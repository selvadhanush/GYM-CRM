const cron = require('node-cron');
const Member = require('../models/Member');
const { sendEmail, sendWhatsApp } = require('./notificationService');

const startCronJobs = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('--- Running Daily Gym CRM Maintenance Job ---');

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Auto Update Status (Active -> Expired)
            const expiredResult = await Member.updateMany(
                { status: 'Active', expiryDate: { $lt: today } },
                { status: 'Expired' }
            );
            console.log(`Auto-Status Update: ${expiredResult.modifiedCount} members shifted to Expired.`);

            // 2. Expiry Reminders (7 Days & 1 Day)
            const reminderDates = [7, 1];

            for (const days of reminderDates) {
                const targetDateStart = new Date(today);
                targetDateStart.setDate(today.getDate() + days);
                const targetDateEnd = new Date(targetDateStart);
                targetDateEnd.setDate(targetDateStart.getDate() + 1);

                const membersToExpire = await Member.find({
                    status: 'Active',
                    expiryDate: { $gte: targetDateStart, $lt: targetDateEnd }
                });

                console.log(`Found ${membersToExpire.length} members expiring in ${days} days.`);

                for (const member of membersToExpire) {
                    const subject = `Gym Membership Expiry Reminder - ${days} day(s) left!`;
                    const messageText = `Hi ${member.name}, your gym membership will expire in ${days} day(s) on ${member.expiryDate.toLocaleDateString()}. Please renew soon to continue your fitness journey!`;
                    const htmlContent = `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px;">
                            <h2 style="color: #6366f1;">Membership Expiry Reminder</h2>
                            <p>Hi <strong>${member.name}</strong>,</p>
                            <p>Your gym membership is set to expire in <strong>${days} day(s)</strong> on <strong>${member.expiryDate.toLocaleDateString()}</strong>.</p>
                            <p>Don't stop your progress! Renew your plan today at the front desk or via the app.</p>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                            <p style="font-size: 0.8rem; color: #64748b;">Best regards,<br>The Gym Management Team</p>
                        </div>
                    `;

                    // Send Email
                    if (member.email) {
                        try {
                            await sendEmail({
                                email: member.email,
                                subject: subject,
                                html: htmlContent
                            });
                        } catch (err) {
                            console.error(`Failed to send email to ${member.name}:`, err.message);
                        }
                    }

                    // Send WhatsApp (Simulation)
                    await sendWhatsApp({
                        phone: member.phone,
                        message: messageText
                    });
                }
            }

            console.log('--- Maintenance Job Completed ---');
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });

    console.log('Cron jobs scheduled logic initialized.');
};

module.exports = startCronJobs;

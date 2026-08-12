const nodemailer = require('nodemailer');
const axios = require('axios');
const logger = require('../lib/logger');

const sendEmail = async (options) => {
    // Create a transporter using SMTP settings from .env
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    const info = await transporter.sendMail(message);
    logger.info({ messageId: info.messageId }, 'Email sent');
};

const sendWhatsApp = async (options) => {
    const { WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN } = process.env;

    // Check if credentials exist for real WhatsApp Cloud API
    if (WA_PHONE_NUMBER_ID && WA_ACCESS_TOKEN && WA_PHONE_NUMBER_ID !== 'your_id') {
        try {
            await axios.post(`https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}/messages`, {
                messaging_product: "whatsapp",
                to: options.phone,
                type: "text",
                text: { body: options.message }
            }, {
                headers: { 'Authorization': `Bearer ${WA_ACCESS_TOKEN}` }
            });
            logger.info(`WhatsApp sent successfully to ${options.phone}`);
        } catch (error) {
            logger.error({ err: error.response?.data || error.message, phone: options.phone }, 'WhatsApp send failed');
        }
    } else {
        logger.debug(`[WhatsApp Simulation] Sending to ${options.phone}: ${options.message}`);
    }
};

module.exports = {
    sendEmail,
    sendWhatsApp,
};

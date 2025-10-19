import axios from 'axios';
import { ParsedMail } from 'mailparser';

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const externalWebhookUrl = process.env.EXTERNAL_WEBHOOK_URL;

/**
 * Sends a formatted notification to a Slack channel.
 */
export const sendSlackNotification = async (subject: string, from: string | undefined) => {
    if (!slackWebhookUrl) {
        console.warn('Slack Webhook URL not set. Skipping notification.');
        return;
    }

    try {
        await axios.post(slackWebhookUrl, {
            text: `🚀 New Interested Lead!\n*From:* ${from}\n*Subject:* ${subject}`
        });
        console.log('Sent Slack notification.');
    } catch (error) {
        console.error('Error sending Slack notification:', error);
    }
};

/**
 * Triggers an external webhook with the full email data.
 */
export const triggerWebhook = async (emailData: ParsedMail) => {
    if (!externalWebhookUrl) {
        console.warn('External Webhook URL not set. Skipping webhook trigger.');
        return;
    }

    try {
        // We can send a subset of data or the full object
        const payload = {
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            body: emailData.text,
            date: emailData.date,
        };
        await axios.post(externalWebhookUrl, payload);
        console.log('Triggered external webhook.');
    } catch (error) {
        console.error('Error triggering external webhook:', error);
    }
};
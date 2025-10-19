// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

// Now, import everything else
import express from 'express';
import cors from 'cors';
import Imap from 'node-imap';
import { connectToImap } from './services/imap.service';
import { createEmailIndexIfNotExists, searchEmails } from './services/elasticsearch.service';

// --- Configuration ---
const accounts: Imap.Config[] = [
    {
        user: process.env.IMAP_USER_1!,
        password: process.env.IMAP_PASSWORD_1!,
        host: process.env.IMAP_HOST_1!,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    },
    {
        user: process.env.IMAP_USER_2!,
        password: process.env.IMAP_PASSWORD_2!,
        host: process.env.IMAP_HOST_2!,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    }
];

const API_PORT = 3001;

/**
 * The main function to start the application.
 */
async function startApp() {
    console.log('🚀 Starting the Onebox application...');
    
    // 1. Ensure the Elasticsearch index is ready
    await createEmailIndexIfNotExists();

    // 2. Start the email syncing process for all accounts
    accounts.forEach(accountConfig => {
        if (accountConfig.user && accountConfig.password && accountConfig.host) {
            connectToImap(accountConfig);
        }
    });

    // 3. Start the API Server to serve data to the frontend
    const app = express();
    app.use(cors());

    app.get('/api/emails', async (req, res) => {
        const query = req.query.q as string || '';
        const account = req.query.account as string || '';
        
        const emails = await searchEmails(query, account);
        res.json(emails);
    });

    app.listen(API_PORT, () => {
        console.log(`✅ API server listening at http://localhost:${API_PORT}`);
    });
}

// --- Start the Application ---
startApp();
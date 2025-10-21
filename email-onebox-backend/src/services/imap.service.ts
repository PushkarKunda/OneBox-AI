import Imap = require('imap');
import { ParsedMail, simpleParser } from 'mailparser';
import { getAddressText, indexEmail } from './elasticsearch.service';
import { categorizeEmail } from './ai.service';
import { sendSlackNotification, triggerWebhook } from './notification.service';

/**
 * A central function to process a parsed email.
 * It handles categorization, indexing, and sending notifications.
 * @param parsedEmail The email object from mailparser.
 * @param config The IMAP configuration object containing user details.
 */
const processEmail = async (parsedEmail: ParsedMail, config: Imap.Config) => {
  // 1. Categorize the email using the AI service
  const category = await categorizeEmail(
    parsedEmail.subject || '',
    parsedEmail.text || '',
  );

  // 2. Index the email in Elasticsearch with its category
  await indexEmail(parsedEmail, config.user!, category);

  // 3. If the category is 'Interested', trigger notifications
  if (category === 'Interested') {
    const fromAddress = getAddressText(parsedEmail.from);
    await sendSlackNotification(
      parsedEmail.subject || 'No Subject',
      fromAddress,
    );
    await triggerWebhook(parsedEmail);
  }
};

/**
 * Fetches the last 30 days of emails and processes them.
 * @param imap The active IMAP connection instance.
 * @param config The IMAP configuration object.
 */
const fetchLast30DaysEmails = (imap: Imap, config: Imap.Config) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const searchCriteria = [
    'ALL',
    ['SINCE', thirtyDaysAgo.toISOString().split('T')[0]],
  ];

  imap.search(searchCriteria, (err, results) => {
    if (err) {
      throw err;
    }

    if (results.length === 0) {
      console.log(`No emails found in the last 30 days for ${config.user}.`);
      return;
    }

    console.log(`Found ${results.length} emails to sync for ${config.user}.`);
    const f = imap.fetch(results, { bodies: '' });

    f.on('message', msg => {
      msg.on('body', stream => {
        simpleParser(stream as any, async (err, parsed) => {
          if (err) {
            console.error('Error parsing email:', err);
            return;
          }
          await processEmail(parsed, config);
        });
      });
    });

    f.once('error', err => {
      console.log('Fetch error: ' + err);
    });

    f.once('end', () => {
      console.log(`Done fetching initial messages for ${config.user}!`);
    });
  });
};

/**
 * Listens for new incoming emails in real-time.
 * @param imap The active IMAP connection instance.
 * @param config The IMAP configuration object.
 */
const listenForNewEmails = (imap: Imap, config: Imap.Config) => {
  imap.on('mail', () => {
    console.log(`📧 New email received for ${config.user}.`);
    imap.search(['UNSEEN'], (err, results) => {
      if (err || !results.length) {
        return;
      }

      const f = imap.fetch(results, { bodies: '', markSeen: true });
      f.on('message', msg => {
        msg.on('body', stream => {
          simpleParser(stream as any, async (err, parsed) => {
            if (err) {
              console.error('Error parsing new email:', err);
              return;
            }
            await processEmail(parsed, config);
          });
        });
      });

      f.once('error', err => console.log('Fetch error on new mail: ' + err));
      f.once('end', () => console.log('Done processing new email.'));
    });
  });
};

/**
 * Establishes and manages a persistent connection to an IMAP server.
 * @param config The IMAP connection configuration.
 */
export const connectToImap = (config: Imap.Config) => {
  const imap = new Imap(config);

  function openInbox(cb: (error: Error, box: Imap.Box) => void) {
    imap.openBox('INBOX', false, cb); // false = read/write
  }

  imap.once('ready', () => {
    console.log(`IMAP connection ready for ${config.user}`);
    openInbox(err => {
      if (err) {
        throw err;
      }
      console.log(`Inbox for ${config.user} opened successfully.`);

      // 1. Perform the initial sync of old emails
      fetchLast30DaysEmails(imap, config);

      // 2. Set up the listener for new emails
      listenForNewEmails(imap, config);
    });
  });

  imap.once('error', (err: Error) => {
    console.log(`IMAP Error for ${config.user}:`, err);
  });

  imap.once('end', () => {
    console.log(`IMAP connection ended for ${config.user}.`);
  });

  imap.connect();
};

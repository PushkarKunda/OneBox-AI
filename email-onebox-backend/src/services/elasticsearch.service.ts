import { Client } from '@elastic/elasticsearch';
import { AddressObject, ParsedMail } from 'mailparser';
import { EmailCategory } from './ai.service';

const client = new Client({ node: 'http://localhost:9200' });
const INDEX_NAME = 'emails';

let isEsAvailable = true;
const inMemoryStore: Map<string, any> = new Map();

/**
 * Seeds realistic demo emails into the in-memory store so the app can be used immediately
 * without requiring real IMAP credentials or .env configuration.
 */
export const seedDemoEmails = () => {
  const sampleEmails = [
    {
      messageId: 'demo-email-1',
      from: 'Sarah Jenkins <sarah.jenkins@acmecorp.com>',
      to: 'demo@onebox.ai',
      subject: 'RE: Product Demo Request - Interested in Enterprise Plan',
      text: 'Hi Team,\n\nThanks for reaching out! We are very interested in scheduling a product demo for our sales team next week. Could you send over available times for a 30-minute overview?\n\nBest regards,\nSarah Jenkins',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Interested',
    },
    {
      messageId: 'demo-email-2',
      from: 'Alex Rivera <alex.rivera@techventure.io>',
      to: 'demo@onebox.ai',
      subject: 'Confirmed: Discovery Call w/ OneBox AI',
      text: 'Hello,\n\nI have confirmed our calendar invite for tomorrow at 3:00 PM EST. Looking forward to discussing how OneBox AI can automate our inbox workflows.\n\nCheers,\nAlex',
      date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Meeting Booked',
    },
    {
      messageId: 'demo-email-3',
      from: 'Recruitment Team <recruitment@admireglobal.com>',
      to: 'demo@onebox.ai',
      subject: 'Walk-in interview | Hiring Trainee Manager @ Admire Global',
      text: 'Dear Candidate,\n\nWe are conducting walk-in interviews for Trainee Manager positions this Friday. Please review the attached position details and reply if you are interested in attending.\n\nRegards,\nHR Team',
      date: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Interested',
    },
    {
      messageId: 'demo-email-4',
      from: 'Mark Taylor <mark.taylor@enterprise.com>',
      to: 'demo@onebox.ai',
      subject: 'Automatic reply: Out of Office until Next Monday',
      text: 'Thank you for your message. I am currently out of the office returning on Monday. For urgent matters, please contact support@enterprise.com.',
      date: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Out of Office',
    },
    {
      messageId: 'demo-email-5',
      from: 'Special Offers <promo@bestdeals-discount.net>',
      to: 'demo@onebox.ai',
      subject: 'Claim your $5,000 gift card reward today!',
      text: 'Congratulations! You have been selected to win a $5,000 shopping card. Click here immediately to claim before offer expires.',
      date: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Spam',
    },
    {
      messageId: 'demo-email-6',
      from: 'Dave Miller <dave@solutec.org>',
      to: 'demo@onebox.ai',
      subject: 'Re: Cold Outreach - Passing for now',
      text: 'Hi,\n\nThanks for reaching out, but we currently have a solution in place and are not interested in acquiring new tools at this stage.\n\nThanks,\nDave',
      date: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
      account: 'demo@onebox.ai',
      folder: 'INBOX',
      category: 'Not Interested',
    },
  ];

  sampleEmails.forEach(email => {
    if (!inMemoryStore.has(email.messageId)) {
      inMemoryStore.set(email.messageId, email);
    }
  });

  console.log(`✅ Seeded ${sampleEmails.length} demo emails into in-memory inbox.`);
};

/**
 * A helper function to safely get address text from mailparser's AddressObject.
 * It handles both single addresses and arrays of addresses.
 */
export const getAddressText = (
  address: AddressObject | AddressObject[] | undefined,
): string | undefined => {
  if (!address) {
    return undefined;
  }
  if (Array.isArray(address)) {
    return address.map(addr => addr.text).join(', ');
  }
  return address.text;
};

/**
 * Creates the 'emails' index in Elasticsearch if it doesn't already exist.
 * This function defines the structure (mapping) of the email documents.
 */
export const createEmailIndexIfNotExists = async () => {
  // Always seed demo emails so the dashboard has emails out of the box
  seedDemoEmails();

  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      console.log(`Index "${INDEX_NAME}" does not exist. Creating...`);
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              from: { type: 'text' },
              to: { type: 'text' },
              subject: { type: 'text' },
              text: { type: 'text' },
              date: { type: 'date' },
              messageId: { type: 'keyword' },
              account: { type: 'keyword' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
            },
          },
        },
      });
      console.log(`Index "${INDEX_NAME}" created successfully.`);
    } else {
      console.log(`Index "${INDEX_NAME}" already exists.`);
    }
    isEsAvailable = true;
  } catch (error: any) {
    isEsAvailable = false;
    console.warn('⚠️ Elasticsearch container not detected at http://localhost:9200.');
    console.log('ℹ️ Operating in fallback mode: using in-memory email store.');
  }
};

/**
 * Indexes a single parsed email document into Elasticsearch or in-memory store.
 * Uses the email's Message-ID to prevent duplicate entries.
 */
export const indexEmail = async (
  email: ParsedMail,
  accountIdentifier: string,
  category: EmailCategory,
) => {
  if (!email.messageId) {
    console.warn('Skipping email with no Message-ID:', email.subject);
    return;
  }

  const emailDoc = {
    from: getAddressText(email.from),
    to: getAddressText(email.to),
    subject: email.subject,
    text: email.text,
    date: email.date,
    messageId: email.messageId,
    account: accountIdentifier,
    folder: 'INBOX',
    category: category,
  };

  // Always store in inMemoryStore as fallback
  inMemoryStore.set(email.messageId, emailDoc);

  if (!isEsAvailable) {
    return;
  }

  try {
    await client.index({
      index: INDEX_NAME,
      id: email.messageId,
      body: emailDoc,
    });
  } catch (error: any) {
    if (isEsAvailable) {
      isEsAvailable = false;
      console.warn('⚠️ Lost connection to Elasticsearch. Switching email store to in-memory mode.');
    }
  }
};

/**
 * Searches for emails in Elasticsearch or in-memory fallback store based on a text query and an account filter.
 * Returns emails sorted by date in descending order.
 */
export const searchEmails = async (query: string, account: string) => {
  if (isEsAvailable) {
    try {
      const mustClauses: any[] = [];

      if (query) {
        mustClauses.push({
          multi_match: {
            query: query,
            fields: ['from', 'to', 'subject', 'text'],
          },
        });
      }

      if (account) {
        mustClauses.push({
          term: { 'account.keyword': account },
        });
      }

      const response = await client.search({
        index: INDEX_NAME,
        size: 1000,
        body: {
          query: {
            bool: {
              must: mustClauses.length > 0 ? mustClauses : { match_all: {} },
            },
          },
          sort: [{ date: { order: 'desc' } }] as any,
        },
      });

      const esHits = response.hits.hits.map((hit: any) => hit._source);
      if (esHits && esHits.length > 0) {
        return esHits;
      }
    } catch (error: any) {
      isEsAvailable = false;
      console.warn('⚠️ Elasticsearch search failed. Falling back to in-memory store.');
    }
  }

  // In-memory search fallback
  let results = Array.from(inMemoryStore.values());

  if (account && account !== 'all' && account !== 'All Accounts') {
    results = results.filter(e => e.account === account);
  }

  if (query) {
    const qLower = query.toLowerCase();
    results = results.filter(e =>
      (e.subject && e.subject.toLowerCase().includes(qLower)) ||
      (e.text && e.text.toLowerCase().includes(qLower)) ||
      (e.from && e.from.toLowerCase().includes(qLower)) ||
      (e.to && e.to.toLowerCase().includes(qLower))
    );
  }

  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return results;
};

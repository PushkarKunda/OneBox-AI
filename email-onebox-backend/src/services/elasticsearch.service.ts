import { Client } from '@elastic/elasticsearch';
import { ParsedMail, AddressObject } from 'mailparser';
import { EmailCategory } from './ai.service';

const client = new Client({ node: 'http://localhost:9200' });
const INDEX_NAME = 'emails';

/**
 * A helper function to safely get address text from mailparser's AddressObject.
 * It handles both single addresses and arrays of addresses.
 */
export const getAddressText = (address: AddressObject | AddressObject[] | undefined): string | undefined => {
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
                        category: { type: 'keyword' }
                    }
                }
            }
        });
        console.log(`Index "${INDEX_NAME}" created successfully.`);
    } else {
        console.log(`Index "${INDEX_NAME}" already exists.`);
    }
};

/**
 * Indexes a single parsed email document into Elasticsearch.
 * Uses the email's Message-ID to prevent duplicate entries.
 */
export const indexEmail = async (email: ParsedMail, accountIdentifier: string, category: EmailCategory) => {
    try {
        if (!email.messageId) {
            console.warn('Skipping email with no Message-ID:', email.subject);
            return;
        }
        await client.index({
            index: INDEX_NAME,
            id: email.messageId,
            body: {
                from: getAddressText(email.from),
                to: getAddressText(email.to),
                subject: email.subject,
                text: email.text,
                date: email.date,
                messageId: email.messageId,
                account: accountIdentifier,
                folder: 'INBOX',
                category: category
            }
        });
    } catch (error) {
        console.error('Error indexing email:', error);
    }
};

/**
 * Searches for emails in Elasticsearch based on a text query and an account filter.
 * Returns emails sorted by date in descending order.
 */
export const searchEmails = async (query: string, account: string) => {
    try {
        const mustClauses: any[] = [];

        if (query) {
            mustClauses.push({
                multi_match: { query: query, fields: ["from", "to", "subject", "text"] },
            });
        }

        if (account) {
            mustClauses.push({
                term: { "account.keyword": account },
            });
        }
        
        const response = await client.search({
            index: INDEX_NAME,
            body: {
                query: {
                    bool: {
                        must: mustClauses.length > 0 ? mustClauses : { match_all: {} }
                    }
                },
                // Reverted to object syntax with 'as any' to satisfy TypeScript
                sort: [{ date: { order: "desc" } }] as any,
            },
        });

        return response.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
        console.error("Error searching emails:", error);
        return [];
    }
};
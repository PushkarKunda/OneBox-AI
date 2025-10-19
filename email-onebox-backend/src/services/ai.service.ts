import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client using the token from your .env file
const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

// Define the possible categories and the specific open-source model we'll use
export type EmailCategory =
  | 'Interested'
  | 'Meeting Booked'
  | 'Not Interested'
  | 'Spam'
  | 'Out of Office'
  | 'Uncategorized';
const CLASSIFICATION_MODEL = 'facebook/bart-large-mnli';

/**
 * Categorizes an email using a free Hugging Face zero-shot classification model.
 * @param subject The subject line of the email.
 * @param body The text content of the email.
 * @returns A promise that resolves to an EmailCategory.
 */
export const categorizeEmail = async (
  subject: string,
  body: string,
): Promise<EmailCategory> => {
  try {
    // Combine subject and body for better context
    const inputText = `Subject: ${subject}\n\nBody: ${body}`;

    // These are the categories the model will choose from
    const candidateLabels: EmailCategory[] = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office',
    ];

    const response = await hf.zeroShotClassification({
      model: CLASSIFICATION_MODEL,
      inputs: inputText.substring(0, 1024), // Truncate to avoid exceeding model limits
      parameters: {
        candidate_labels: candidateLabels,
      },
    });

    // The response is an array of labels and scores, sorted from highest to lowest
    if (response && response.length > 0) {
      const topCategory = response[0];

      // We set a confidence threshold to avoid making bad guesses
      if (topCategory.score > 0.7) {
        console.log(
          `HF Classified as "${topCategory.label}" with score ${topCategory.score.toFixed(2)}`,
        );
        return topCategory.label as EmailCategory;
      }
    }

    console.log(
      'HF classification confidence was too low, defaulting to Uncategorized.',
    );
    return 'Uncategorized';
  } catch (error) {
    console.error('Error categorizing email with Hugging Face:', error);
    return 'Uncategorized'; // Return a default category if there's an API error
  }
};

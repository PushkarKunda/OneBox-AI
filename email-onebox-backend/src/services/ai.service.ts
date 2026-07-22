import { HfInference } from '@huggingface/inference';

const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
const isValidToken = Boolean(hfToken && !hfToken.includes('your-huggingface-api-key'));

const hf = isValidToken ? new HfInference(hfToken) : null;

export type EmailCategory =
  | 'Interested'
  | 'Meeting Booked'
  | 'Not Interested'
  | 'Spam'
  | 'Out of Office'
  | 'Uncategorized';

const CLASSIFICATION_MODEL = 'facebook/bart-large-mnli';

/**
 * Basic rule-based fallback categorization based on subject/body keywords.
 */
const ruleBasedCategorize = (subject: string, body: string): EmailCategory => {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.includes('out of office') || text.includes('ooo') || text.includes('auto-reply') || text.includes('autoreply')) {
    return 'Out of Office';
  }
  if (text.includes('unsubscribe') || text.includes('win $') || text.includes('lottery') || text.includes('advertisement')) {
    return 'Spam';
  }
  if (text.includes('interview') || text.includes('meeting') || text.includes('scheduled') || text.includes('calendar') || text.includes('demo')) {
    return 'Meeting Booked';
  }
  if (text.includes('interested') || text.includes('hiring') || text.includes('apply') || text.includes('opportunity') || text.includes('job') || text.includes('trainee manager')) {
    return 'Interested';
  }
  if (text.includes('not interested') || text.includes('decline') || text.includes('pass on this')) {
    return 'Not Interested';
  }

  return 'Uncategorized';
};

/**
 * Categorizes an email using Hugging Face zero-shot classification model or rule-based fallback.
 */
export const categorizeEmail = async (
  subject: string,
  body: string,
): Promise<EmailCategory> => {
  if (!hf) {
    return ruleBasedCategorize(subject, body);
  }

  try {
    const inputText = `Subject: ${subject}\n\nBody: ${body}`;
    const candidateLabels: EmailCategory[] = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office',
    ];

    const response = await hf.zeroShotClassification({
      model: CLASSIFICATION_MODEL,
      inputs: inputText.substring(0, 1024),
      parameters: {
        candidate_labels: candidateLabels,
      },
    });

    if (response && response.length > 0) {
      const topCategory = response[0];
      if (topCategory.score > 0.7) {
        console.log(
          `HF Classified as "${topCategory.label}" with score ${topCategory.score.toFixed(2)}`,
        );
        return topCategory.label as EmailCategory;
      }
    }

    return ruleBasedCategorize(subject, body);
  } catch (error: any) {
    console.warn(`⚠️ Hugging Face API classification skipped (${error.message || 'Auth issue'}). Using rule-based categorization.`);
    return ruleBasedCategorize(subject, body);
  }
};

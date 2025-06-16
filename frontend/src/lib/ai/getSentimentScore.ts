// A simple function to analyze the sentiment of a message
// In a real implementation, this would call an AI service
export const getSentimentScore = (text: string): number => {
  // This is a very naive implementation for demonstration purposes
  const positiveWords = [
    'thanks',
    'great',
    'good',
    'excellent',
    'happy',
    'interested',
    'excited',
    'love',
    'perfect',
    'yes',
    'wonderful',
  ];
  const negativeWords = [
    'bad',
    'not',
    "don't",
    'expensive',
    'disappointed',
    'unfortunately',
    'cannot',
    'problem',
    'issue',
    'no',
    'terrible',
  ];

  const lowerText = text.toLowerCase();

  let score = 0;

  // Count positive and negative words
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      score += 0.1;
    }
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      score -= 0.1;
    }
  });

  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, score));
};

// Analyze sentiment and generate a human-readable result
export const analyzeSentiment = (
  text: string
): { score: number; label: string; color: string } => {
  const score = getSentimentScore(text);

  let label = 'Neutral';
  let color = 'text-gray-500';

  if (score > 0.5) {
    label = 'Very Positive';
    color = 'text-green-600';
  } else if (score > 0.2) {
    label = 'Positive';
    color = 'text-green-500';
  } else if (score < -0.5) {
    label = 'Very Negative';
    color = 'text-red-600';
  } else if (score < -0.2) {
    label = 'Negative';
    color = 'text-red-500';
  }

  return { score, label, color };
};

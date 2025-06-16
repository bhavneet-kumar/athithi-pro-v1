import { isValid } from 'date-fns';

import type { Lead, LeadSuggestion } from '@/types/crm';

// Helper function to safely handle dates
const toDate = (value: Date | string | undefined): Date | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isValid(date) ? date : null;
  }

  return isValid(value) ? value : null;
};

// Enhanced AI service for lead prioritization
export const getLeadSuggestions = async (
  lead: Lead
): Promise<LeadSuggestion> => {
  // In a real implementation, this would call an AI service
  // For now, we'll use some enhanced heuristics to simulate AI
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Calculate priority based on multiple factors
    let priorityScore = 0.5; // Default score
    const priorityFactors: Record<string, number> = {};

    // 1. Budget-based priority
    if (lead.budget) {
      if (lead.budget > 10000) {
        priorityScore += 0.25;
        priorityFactors.budget = 0.25;
      } else if (lead.budget > 5000) {
        priorityScore += 0.15;
        priorityFactors.budget = 0.15;
      } else if (lead.budget > 2000) {
        priorityScore += 0.1;
        priorityFactors.budget = 0.1;
      }
    }

    // 2. Source-based priority (referrals are higher quality leads)
    if (lead.source === 'referral') {
      priorityScore += 0.15;
      priorityFactors.referral = 0.15;
    } else if (lead.source === 'marketplace') {
      priorityScore += 0.1;
      priorityFactors.marketplace = 0.1;
    }

    // 3. Tag-based priority
    if (lead.tags.includes('honeymoon')) {
      priorityScore += 0.15;
      priorityFactors.honeymoon = 0.15;
    }
    if (lead.tags.includes('luxury')) {
      priorityScore += 0.1;
      priorityFactors.luxury = 0.1;
    }
    if (lead.tags.includes('return-customer')) {
      priorityScore += 0.2; // Return customers are high priority
      priorityFactors.returnCustomer = 0.2;
    }

    // 4. Time to travel date priority (closer dates = higher priority)
    if (lead.travelDates?.start) {
      const now = new Date();
      const travelDate = toDate(lead.travelDates.start);

      if (travelDate) {
        const daysUntilTravel =
          (travelDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

        if (daysUntilTravel < 14) {
          // Less than two weeks away
          priorityScore += 0.2;
          priorityFactors.urgentTravel = 0.2;
        } else if (daysUntilTravel < 30) {
          // Less than a month away
          priorityScore += 0.15;
          priorityFactors.upcomingTravel = 0.15;
        } else if (daysUntilTravel < 90) {
          // Less than three months away
          priorityScore += 0.1;
          priorityFactors.plannedTravel = 0.1;
        }
      }
    }

    // 5. Recent creation priority
    const createdAtDate = toDate(lead.createdAt);

    if (createdAtDate) {
      const daysSinceCreation =
        (new Date().getTime() - createdAtDate.getTime()) / (1000 * 3600 * 24);

      if (daysSinceCreation < 2) {
        priorityScore += 0.05;
        priorityFactors.recentLead = 0.05;
      }
    }

    // Cap at 1.0
    priorityScore = Math.min(1, priorityScore);

    // Suggest next action based on status
    let nextAction = '';
    let replyTemplate = '';

    switch (lead.status) {
      case 'new':
        nextAction = 'Make initial contact';
        replyTemplate = `Hi ${lead.name}, thank you for your interest in AthitiPRO travel services. I'd like to learn more about your travel plans to ${lead.preferences?.destination || 'your destination'}. When would be a good time to chat?`;
        break;
      case 'contacted':
        nextAction = 'Follow up on initial contact';
        replyTemplate = `Hi ${lead.name}, I'm following up on our conversation about your trip to ${lead.preferences?.destination || 'your destination'}. I have some great options I'd like to share with you.`;
        break;
      case 'qualified':
        nextAction = 'Send customized proposal';
        replyTemplate = `Hi ${lead.name}, based on our discussions, I've prepared some options for your ${lead.preferences?.destination || 'travel'} itinerary. Would you like to schedule a time to review them?`;
        break;
      case 'proposal':
        nextAction = 'Follow up on proposal';
        replyTemplate = `Hi ${lead.name}, I'm checking in to see if you've had a chance to review the travel proposal I sent. Do you have any questions or would you like to discuss any adjustments?`;
        break;
      case 'negotiation':
        nextAction = 'Confirm final details';
        replyTemplate = `Hi ${lead.name}, we're almost there! I just need to confirm a few final details to secure your booking for ${lead.preferences?.destination || 'your trip'}.`;
        break;
      default:
        nextAction = 'General follow-up';
        replyTemplate = `Hi ${lead.name}, how are you? I'd love to touch base regarding your travel plans. Let me know if there's anything I can help with.`;
    }

    // Suggest tags based on preferences and notes
    const suggestedTags: string[] = [];
    const allText =
      `${lead.notes || ''} ${lead.preferences ? JSON.stringify(lead.preferences) : ''}`.toLowerCase();

    if (
      allText.includes('beach') ||
      allText.includes('ocean') ||
      allText.includes('sea')
    ) {
      suggestedTags.push('beach');
    }
    if (
      allText.includes('mountain') ||
      allText.includes('hiking') ||
      allText.includes('trek')
    ) {
      suggestedTags.push('adventure');
    }

    if (
      allText.includes('spa') ||
      allText.includes('relax') ||
      allText.includes('wellness')
    ) {
      suggestedTags.push('wellness');
    }
    if (
      allText.includes('food') ||
      allText.includes('culinary') ||
      allText.includes('dining')
    ) {
      suggestedTags.push('culinary');
    }

    return {
      priorityScore,
      priorityFactors,
      nextAction,
      replyTemplate,
      tags: suggestedTags.length > 0 ? suggestedTags : undefined,
    };
  } catch (error) {
    console.error('Error getting lead suggestions:', error);
    // Fallback values in case of error
    return {
      priorityScore: 0.5,
      nextAction: 'Follow up with lead',
      replyTemplate: `Hi ${lead.name}, I'm following up about your travel plans. How can I assist you?`,
    };
  }
};

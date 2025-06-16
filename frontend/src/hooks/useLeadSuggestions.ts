import { isValid } from 'date-fns';
import { useState, useEffect } from 'react';

import { toast } from '@/hooks/use-toast';
import { getLeadSuggestions } from '@/lib/ai/getLeadSuggestions';
import { useCrmStore } from '@/lib/store';
import type { Lead, LeadSuggestion } from '@/types/crm';

// Helper to validate lead data for AI processing
const isValidForAiProcessing = (lead: Lead): boolean => {
  if (!lead) {
    return false;
  }

  // Validate dates to avoid processing bad data
  if (lead.createdAt) {
    const createdAtDate =
      typeof lead.createdAt === 'string'
        ? new Date(lead.createdAt)
        : lead.createdAt;
    if (!isValid(createdAtDate)) {
      return false;
    }
  }

  if (lead.travelDates?.start) {
    const startDate =
      typeof lead.travelDates.start === 'string'
        ? new Date(lead.travelDates.start)
        : lead.travelDates.start;
    if (!isValid(startDate)) {
      return false;
    }
  }

  return true;
};

export function useLeadSuggestions(leadId?: string) {
  const { leads, updateLead } = useCrmStore();
  const lead = leadId ? leads.find(l => l.id === leadId) : undefined;

  const [suggestions, setSuggestions] = useState<LeadSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async (leadToProcess?: Lead) => {
    const targetLead = leadToProcess || lead;
    if (!targetLead) {
      return;
    }

    // Validate lead before processing
    if (!isValidForAiProcessing(targetLead)) {
      setError(
        'Lead data contains invalid dates or values. Cannot generate suggestions.'
      );
      console.error('Invalid lead data for AI processing:', targetLead);

      toast({
        title: 'AI Suggestion Error',
        description: 'Lead contains invalid data. Please check date fields.',
        variant: 'destructive',
      });

      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getLeadSuggestions(targetLead);
      setSuggestions(result);

      // Important: Update the lead in the store with the new priority score
      if (result.priorityScore !== targetLead.aiPriorityScore) {
        console.log(
          `Updating lead ${targetLead.id} priority from ${targetLead.aiPriorityScore} to ${result.priorityScore}`
        );
        updateLead(targetLead.id, {
          aiPriorityScore: result.priorityScore,
          updatedAt: new Date(),
        });
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load AI suggestions';
      setError(errorMessage);
      console.error('Error loading AI suggestions:', err);

      // Display a toast notification for the error
      toast({
        title: 'AI Suggestion Error',
        description:
          'There was an error loading lead suggestions. Please try again.',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lead) {
      loadSuggestions(lead);
    }
  }, [lead?.id]);

  return {
    suggestions,
    isLoading,
    error,
    loadSuggestions,
  };
}

import type { Lead, LeadCohort } from '@/types/crm';

// This is a placeholder for an actual AI service that would analyze leads and group them into cohorts
export const generateCohorts = (leads: Lead[]): LeadCohort[] => {
  const cohorts: LeadCohort[] = [];

  // Group by destination if available
  const destinationMap: Record<string, string[]> = {};

  leads.forEach(lead => {
    const destination = lead.preferences?.destination;
    if (destination) {
      if (!destinationMap[destination]) {
        destinationMap[destination] = [];
      }
      destinationMap[destination].push(lead.id);
    }
  });

  // Create cohorts for destinations with more than one lead
  Object.entries(destinationMap).forEach(([destination, leadIds]) => {
    if (leadIds.length > 1) {
      cohorts.push({
        id: `cohort-${destination.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${destination} Travelers`,
        description: `Leads interested in traveling to ${destination}`,
        leadIds,
        tags: [destination.toLowerCase()],
        createdAt: new Date(),
      });
    }
  });

  // Group by travel month if available
  const monthMap: Record<string, string[]> = {};

  leads.forEach(lead => {
    const travelDate = lead.travelDates?.start;
    if (travelDate) {
      // Convert string dates back to Date objects if necessary
      const travelDateObj =
        travelDate instanceof Date ? travelDate : new Date(travelDate);

      // Handle invalid dates
      if (!isNaN(travelDateObj.getTime())) {
        const month = travelDateObj.getMonth();
        const year = travelDateObj.getFullYear();
        const key = `${year}-${month}`;

        if (!monthMap[key]) {
          monthMap[key] = [];
        }
        monthMap[key].push(lead.id);
      }
    }
  });

  // Create cohorts for months with more than one lead
  Object.entries(monthMap).forEach(([key, leadIds]) => {
    if (leadIds.length > 1) {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month);
      const monthName = date.toLocaleString('default', { month: 'long' });

      cohorts.push({
        id: `cohort-${monthName.toLowerCase()}-${year}`,
        name: `${monthName} ${year} Travelers`,
        description: `Leads planning to travel in ${monthName} ${year}`,
        leadIds,
        tags: ['upcoming', monthName.toLowerCase()],
        createdAt: new Date(),
      });
    }
  });

  // Group by budget range
  const budgetRanges = [
    { min: 0, max: 3000, name: 'Budget' },
    { min: 3001, max: 6000, name: 'Mid-range' },
    { min: 6001, max: Infinity, name: 'Luxury' },
  ];

  budgetRanges.forEach(range => {
    const leadsInRange = leads.filter(
      lead =>
        lead.budget !== undefined &&
        lead.budget >= range.min &&
        lead.budget <= range.max
    );

    if (leadsInRange.length > 1) {
      cohorts.push({
        id: `cohort-${range.name.toLowerCase()}`,
        name: `${range.name} Travelers`,
        description: `Leads with ${range.name.toLowerCase()} travel budgets`,
        leadIds: leadsInRange.map(lead => lead.id),
        tags: [range.name.toLowerCase()],
        createdAt: new Date(),
      });
    }
  });

  return cohorts;
};

import { Lead } from '@/types/crm';

// Mock data generator for missing fields
export const generateMockLeadData = (apiLead: Lead): Lead => {
  const mockData: Partial<Lead> = {};

  // Mock data for missing fields - all starting with 'test'
  if (!apiLead.assignedTo) {
    mockData.assignedTo = 'test-user-123';
  }

  if (!apiLead.travelDetails?.budget?.value) {
    mockData.travelDetails = {
      ...apiLead.travelDetails,
      budget: {
        ...apiLead.travelDetails?.budget,
        value: 50000,
      },
    };
  }

  if (!apiLead.travelDetails?.preferences?.accommodation) {
    mockData.travelDetails = {
      ...mockData.travelDetails,
      ...apiLead.travelDetails,
      preferences: {
        ...apiLead.travelDetails?.preferences,
        accommodation: 'test-5-star-hotel',
      },
    };
  }

  if (!apiLead.travelDetails?.preferences?.specialRequests) {
    mockData.travelDetails = {
      ...mockData.travelDetails,
      ...apiLead.travelDetails,
      preferences: {
        ...mockData.travelDetails?.preferences,
        ...apiLead.travelDetails?.preferences,
        specialRequests: 'test-ocean-view-room-preferred',
      },
    };
  }

  if (!apiLead.tags || apiLead.tags.length === 0) {
    mockData.tags = ['test-family', 'test-beach', 'test-summer'];
  }

  if (!apiLead.notes) {
    mockData.notes =
      'test-this-lead-shows-great-potential-for-a-luxury-vacation-package';
  }

  if (!apiLead.nextFollowUp) {
    // Set follow-up to 3 days from now
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 3);
    mockData.nextFollowUp = followUpDate.toISOString();
  }

  if (!apiLead.followUpReason) {
    mockData.followUpReason = 'test-discuss-custom-package-options-and-pricing';
  }

  if (!apiLead.aiScore?.lastCalculated) {
    mockData.aiScore = {
      ...apiLead.aiScore,
      lastCalculated: new Date().toISOString(),
    };
  }

  if (!apiLead.collaborators || apiLead.collaborators.length === 0) {
    mockData.collaborators = ['test-collaborator-1', 'test-collaborator-2'];
  }

  if (!apiLead.isReturnCustomer) {
    mockData.isReturnCustomer = false;
  }

  if (!apiLead.previousBookings) {
    mockData.previousBookings = [];
  }

  // Merge mock data with API data
  return {
    ...apiLead,
    ...mockData,
    travelDetails: {
      ...apiLead.travelDetails,
      ...mockData.travelDetails,
    },
    aiScore: {
      ...apiLead.aiScore,
      ...mockData.aiScore,
    },
  };
};

// Mock data for related entities
export const generateMockCommunications = (leadId: string) => [
  {
    id: 'test-comm-1',
    leadId,
    channel: 'email' as const,
    direction: 'outgoing' as const,
    content: 'test-thank-you-for-your-inquiry-about-our-luxury-travel-packages',
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'test-user-123',
  },
  {
    id: 'test-comm-2',
    leadId,
    channel: 'phone' as const,
    direction: 'incoming' as const,
    content: 'test-customer-called-to-discuss-budget-and-preferences',
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'test-customer',
  },
];

export const generateMockTasks = (leadId: string) => [
  {
    id: 'test-task-1',
    title: 'test-send-custom-proposal',
    description: 'test-create-personalized-travel-package-proposal',
    type: 'email' as const,
    priority: 'high' as const,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    leadId,
    assignedTo: 'test-user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'test-task-2',
    title: 'test-follow-up-call',
    description: 'test-call-customer-to-discuss-proposal-feedback',
    type: 'call' as const,
    priority: 'medium' as const,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    leadId,
    assignedTo: 'test-user-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const generateMockBookings = (leadId: string) => [
  {
    id: 'test-booking-1',
    leadId,
    status: 'draft' as const,
    itinerary: {
      id: 'test-itinerary-1',
      name: 'test-luxury-bali-package',
      description: 'test-7-days-luxury-bali-vacation',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
    },
    totalAmount: 75000,
    paidAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

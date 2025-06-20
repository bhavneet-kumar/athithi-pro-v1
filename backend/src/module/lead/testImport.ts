import { Types } from 'mongoose';

import { LeadSource, LeadStatus } from '../../types/enum/lead';

import { ILeadImport } from './lead.interface';
import { leadService } from './lead.service';

const STATUS_CHECK_DELAY = 5000; // 5 seconds

const createSampleLeadData = (): ILeadImport => ({
  importId: `test-import-${Date.now()}`,
  leads: [
    {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      priority: 'high',
      travelDetails: {
        destination: 'Paris, France',
        departureDate: new Date('2024-06-15'),
        returnDate: new Date('2024-06-22'),
        travelers: {
          adults: 2,
          children: 1,
          infants: 0,
        },
        budget: {
          min: 5000,
          max: 8000,
          value: 6500,
          currency: 'USD',
        },
        packageType: 'luxury',
        preferences: {
          accommodation: '5-star hotel',
          transport: 'private car',
          mealPreference: 'vegetarian',
          specialRequests: 'Early check-in preferred',
        },
      },
      tags: ['luxury', 'family', 'europe'],
      notes: 'Interested in cultural tours and fine dining',
    },
  ],
  createdBy: new Types.ObjectId('507f1f77bcf86cd799439011'),
});

const testLeadImport = async (): Promise<void> => {
  try {
    console.log('🚀 Starting lead import test...');

    const importData = createSampleLeadData();
    const agencyId = '507f1f77bcf86cd799439012';

    console.log('📤 Queuing import job...');
    const result = await leadService.importLeads(agencyId, importData);
    console.log('✅ Import job queued successfully:', result);

    setTimeout(async () => {
      const status = await leadService.getImportStatus(importData.importId);
      console.log('📊 Import status:', status);
    }, STATUS_CHECK_DELAY);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

export { testLeadImport };

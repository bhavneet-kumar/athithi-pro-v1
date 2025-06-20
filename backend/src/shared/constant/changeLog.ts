// Define which fields to track for each model
export const TRACKED_FIELDS = {
  Lead: [
    'status',
    'priority',
    'assignedTo',
    'source',
    'travelDetails.budget.value',
    'travelDetails.destination',
    'travelDetails.departureDate',
    'travelDetails.returnDate',
    'nextFollowUp',
    'audit.updatedBy',
  ],
  //   Agency: ['name', 'status', 'isActive', 'subscription.plan', 'subscription.status', 'audit.updatedBy'],
  //   User: ['email', 'role', 'isActive', 'profile.firstName', 'profile.lastName', 'permissions', 'audit.updatedBy'],
} as const;

// Type for tracked field keys
export type TrackedModelNames = keyof typeof TRACKED_FIELDS;

// Helper function to check if a model should be tracked
export const isModelTracked = (modelName: string): modelName is TrackedModelNames => modelName in TRACKED_FIELDS;

// Operation types for change logs
export const CHANGE_LOG_OPERATIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type ChangeLogOperation = (typeof CHANGE_LOG_OPERATIONS)[keyof typeof CHANGE_LOG_OPERATIONS];

export const MAX_MAP_SIZE = 1000;
const minutesInHour = 60;
const secondsInMinute = 60;
const millisecondsInSecond = 1000;
export const CLEANUP_INTERVAL_MS = minutesInHour * secondsInMinute * millisecondsInSecond; // 1 hour

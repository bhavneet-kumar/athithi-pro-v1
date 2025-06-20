# Lead Import with Redis Streams

This module implements a robust lead import system using Redis Streams for asynchronous processing and better scalability.

## Architecture

### Components

1. **LeadStreamsService** (`leadStreams.service.ts`)

   - Manages Redis streams for lead import jobs
   - Processes import jobs in batches
   - Tracks job progress and status

2. **LeadService** (`lead.service.ts`)

   - Updated to queue import jobs instead of direct processing
   - Provides status checking functionality

3. **LeadController** (`lead.controller.ts`)

   - Handles import requests and status queries
   - Returns immediate response with job ID

4. **Startup Script** (`leadStreams.startup.ts`)
   - Initializes the streams processor on application startup

## How It Works

### 1. Import Request Flow

```
Client Request → Controller → Service → Redis Stream → Background Processor
```

1. Client sends import request with lead data
2. Controller validates request and calls service
3. Service queues job in Redis stream
4. Returns immediate response with import ID
5. Background processor picks up job and processes leads

### 2. Processing Flow

```
Redis Stream → Consumer Group → Batch Processing → Database → Status Updates
```

1. Background processor reads from Redis stream
2. Processes leads in configurable batches (default: 50)
3. Updates progress in Redis cache
4. Handles errors gracefully with detailed reporting

### 3. Status Tracking

- Job status stored in Redis cache with TTL (1 hour)
- Real-time progress updates
- Detailed error reporting per lead
- Status: `pending` → `processing` → `completed`/`failed`

## API Endpoints

### Import Leads

```http
POST /leads/import
Content-Type: application/json

{
  "importId": "unique-import-id",
  "leads": [
    {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "NEW",
      "source": "WEBSITE"
    }
  ],
  "createdBy": "507f1f77bcf86cd799439011"
}
```

### Check Import Status

```http
GET /leads/import/{importId}/status
```

Response:

```json
{
  "importId": "unique-import-id",
  "status": "processing",
  "progress": {
    "total": 100,
    "processed": 50,
    "successful": 48,
    "failed": 2,
    "errors": [
      {
        "index": 25,
        "error": "Email already exists"
      }
    ]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:01:00.000Z"
}
```

## Configuration

### Constants (in `leadStreams.service.ts`)

- `BATCH_SIZE`: Number of leads processed per batch (default: 50)
- `CACHE_TTL`: Redis cache TTL in seconds (default: 3600)
- `BLOCK_TIMEOUT`: Stream read timeout in milliseconds (default: 5000)
- `BATCH_DELAY`: Delay between batches in milliseconds (default: 100)

### Redis Keys

- Stream: `lead:imports`
- Consumer Group: `lead-import-processors`
- Consumer: `lead-import-consumer-1`
- Cache: `import:job:{importId}`

## Error Handling

### Import Job Errors

- Individual lead failures don't stop the entire job
- Detailed error reporting with row indices
- Failed leads are logged but processing continues
- Job marked as completed even with some failures

### System Errors

- Redis connection issues are handled gracefully
- Database errors are caught and logged
- Stream processing continues after errors
- Automatic acknowledgment prevents infinite retries

## Benefits

1. **Scalability**: Asynchronous processing allows handling large imports
2. **Reliability**: Redis streams provide persistence and fault tolerance
3. **Monitoring**: Real-time progress tracking and detailed error reporting
4. **Performance**: Batch processing reduces database load
5. **User Experience**: Immediate response with status tracking

## Setup

1. Ensure Redis is running and configured
2. Import the startup function in your main application file:

```typescript
import { initializeLeadStreamsProcessor } from './module/lead/leadStreams.startup';

// In your app startup
await initializeLeadStreamsProcessor();
```

3. The processor will start automatically and begin processing jobs

## Monitoring

- Check Redis stream length: `XLEN lead:imports`
- Monitor consumer group: `XINFO GROUPS lead:imports`
- View pending messages: `XPENDING lead:imports lead-import-processors`
- Check cache keys: `KEYS import:job:*`

## Future Enhancements

- Multiple consumer instances for parallel processing
- Priority queues for different import types
- Retry mechanisms for failed leads
- WebSocket notifications for real-time updates
- Import templates and validation rules

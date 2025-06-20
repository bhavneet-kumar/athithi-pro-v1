import { apiSlice } from '../apiSlice';
import { Lead } from '../../../types/crm';

// Lead request/response types
export interface LeadAddRequest {
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  source: string;
  assignedTo?: string;
  travelDetails?: {
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    budget?: {
      currency: string;
      value: number;
    };
    preferences?: {
      accommodation?: string;
      specialRequests?: string;
    };
  };
  tags: string[];
  notes?: string;
  nextFollowUp?: string;
  followUpReason?: string;
}

export interface LeadUpdateRequest extends Partial<LeadAddRequest> {
  id: string;
}

export interface LeadPaginationParams {
  status?: string;
  page?: number;
  limit?: number;
  skip?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
}

export interface LeadResponse {
  success: boolean;
  code: number;
  status: string;
  message: string;
  data: Lead;
  timestamp: string;
  path: string;
}

export interface LeadApiResponse {
  success: boolean;
  code: number;
  status: string;
  message: string;
  data: {
    data: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
  path: string;
}

export const leadApi = apiSlice.injectEndpoints({
  endpoints: builder => ({
    // Add new lead
    leadAdd: builder.mutation<LeadResponse, LeadAddRequest>({
      query: leadData => ({
        url: 'lead',
        method: 'POST',
        body: leadData,
        credentials: 'include',
      }),
      invalidatesTags: ['Leads'],
    }),

    // Update existing lead
    leadUpdate: builder.mutation<LeadResponse, LeadUpdateRequest>({
      query: ({ id, ...leadData }) => ({
        url: `lead/${id}`,
        method: 'PUT',
        body: leadData,
        credentials: 'include',
      }),
      invalidatesTags: ['Leads'],
    }),

    // Delete lead
    leadDelete: builder.mutation<{ success: boolean; message: string }, string>(
      {
        query: id => ({
          url: `lead/${id}`,
          method: 'DELETE',
          credentials: 'include',
        }),
        invalidatesTags: ['Leads'],
      }
    ),

    // Get all leads with pagination - TEST VERSION
    leadGetAll: builder.query<LeadApiResponse, LeadPaginationParams>({
      query: params => {
        // Simplified approach - try minimal parameters first
        const searchParams = new URLSearchParams();

        // Only add essential parameters
        if (params.status) {
          searchParams.append('status', params.status.toUpperCase());
        }

        // Try with explicit number conversion and validation
        const page = Number(params.page);
        const limit = Number(params.limit);

        if (!isNaN(page) && page > 0) {
          searchParams.append('page', page.toString());
        }
        if (!isNaN(limit) && limit > 0) {
          searchParams.append('limit', limit.toString());
        }

        if (params.search && params.search.trim()) {
          searchParams.append('search', params.search.trim());
        }

        const queryString = searchParams.toString();
        const url = `lead${queryString ? `?${queryString}` : ''}`;

        return {
          url,
          method: 'GET',
          credentials: 'include',
        };
      },
      providesTags: ['Leads'],
    }),

    // Get single lead by ID
    leadGetById: builder.query<LeadResponse, string>({
      query: id => ({
        url: `lead/${id}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),

    // Get leads by status
    leadGetByStatus: builder.query<LeadApiResponse, string>({
      query: status => ({
        url: `leads/status/${status}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: ['Leads'],
    }),

    // Get leads assigned to user
    leadGetByAssignee: builder.query<LeadApiResponse, string>({
      query: assigneeId => ({
        url: `leads/assignee/${assigneeId}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: ['Leads'],
    }),

    // Change leads status to user
    leadChangeStatus: builder.mutation<
      LeadApiResponse,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `lead/${id}/change-status`,
        method: 'PUT',
        credentials: 'include',
        body: { status },
      }),
      invalidatesTags: ['Leads'],
    }),
  }),
});

export const {
  useLeadAddMutation,
  useLeadUpdateMutation,
  useLeadDeleteMutation,
  useLeadGetAllQuery,
  useLeadGetByIdQuery,
  useLeadGetByStatusQuery,
  useLeadGetByAssigneeQuery,
  useLeadChangeStatusMutation,
} = leadApi;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Lead, Task, Communication, Booking } from '@/types/crm';
import {
  LeadStatus,
  LeadSource,
  TaskType,
  TaskPriority,
  CommunicationChannel,
} from '@/types/crm';

interface CrmState {
  // Data
  leads: Lead[];
  tasks: Task[];
  communications: Communication[];
  bookings: Booking[];

  // UI State
  leadViewMode: 'list' | 'kanban';
  currentLeadId: string | null;
  currentTaskId: string | null;
  sidebarCollapsed: boolean;
  isOffline: boolean;

  // Actions
  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string, completed: boolean) => void;

  addCommunication: (communication: Communication) => void;
  updateCommunication: (id: string, data: Partial<Communication>) => void;
  deleteCommunication: (id: string) => void;

  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;

  setLeadViewMode: (mode: 'list' | 'kanban') => void;
  setCurrentLeadId: (id: string | null) => void;
  setCurrentTaskId: (id: string | null) => void;
  toggleSidebar: () => void;
  setOfflineStatus: (isOffline: boolean) => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    set => ({
      // Initial state
      leads: generateMockLeads(),
      tasks: generateMockTasks(),
      communications: generateMockCommunications(),
      bookings: generateMockBookings(),

      leadViewMode: 'list',
      currentLeadId: null,
      currentTaskId: null,
      sidebarCollapsed: false,
      isOffline: false,

      // Actions
      addLead: lead =>
        set(state => ({
          leads: [...state.leads, lead],
        })),

      updateLead: (id, data) =>
        set(state => ({
          leads: state.leads.map(lead =>
            lead._id === id ? { ...lead, ...data, updatedAt: new Date() } : lead
          ),
        })),

      deleteLead: id =>
        set(state => ({
          leads: state.leads.filter(lead => lead._id !== id),
        })),

      addTask: task =>
        set(state => ({
          tasks: [...state.tasks, task],
        })),

      updateTask: (id, data) =>
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...data, updatedAt: new Date() } : task
          ),
        })),

      deleteTask: id =>
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id),
        })),

      toggleTaskCompletion: (id, completed) =>
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id
              ? {
                  ...task,
                  completed,
                  completedAt: completed ? new Date() : undefined,
                  updatedAt: new Date(),
                }
              : task
          ),
        })),

      addCommunication: communication =>
        set(state => ({
          communications: [...state.communications, communication],
        })),

      updateCommunication: (id, data) =>
        set(state => ({
          communications: state.communications.map(comm =>
            comm.id === id ? { ...comm, ...data } : comm
          ),
        })),

      deleteCommunication: id =>
        set(state => ({
          communications: state.communications.filter(comm => comm.id !== id),
        })),

      addBooking: booking =>
        set(state => ({
          bookings: [...state.bookings, booking],
        })),

      updateBooking: (id, data) =>
        set(state => ({
          bookings: state.bookings.map(booking =>
            booking.id === id
              ? { ...booking, ...data, updatedAt: new Date() }
              : booking
          ),
        })),

      deleteBooking: id =>
        set(state => ({
          bookings: state.bookings.filter(booking => booking.id !== id),
        })),

      setLeadViewMode: mode => set({ leadViewMode: mode }),
      setCurrentLeadId: id => set({ currentLeadId: id }),
      setCurrentTaskId: id => set({ currentTaskId: id }),
      toggleSidebar: () =>
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setOfflineStatus: isOffline => set({ isOffline }),
    }),
    {
      name: 'crm-store',
    }
  )
);

// Helper function to generate mock data
function generateMockLeads(): Lead[] {
  return [
    {
      _id: 'lead-1',
      fullName: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1234567890',
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      tags: ['family', 'beach', 'summer'],
      notes: 'Looking for a family vacation package to Hawaii',
      travelDetails: {
        destination: 'Hawaii',
        departureDate: new Date(2023, 6, 15),
        returnDate: new Date(2023, 6, 25),
        budget: {
          currency: 'USD',
          value: 5000,
        },
        preferences: {
          accommodation: 'Resort',
          specialRequests: 'Beach, Hiking, Snorkeling',
        },
      },
      createdAt: new Date(2023, 5, 10),
      updatedAt: new Date(2023, 5, 10),
      assignedTo: 'agent-1',
      collaborators: [],
      aiScore: {
        value: 85,
      },
      isReturnCustomer: false,
    },
    {
      _id: 'lead-2',
      fullName: 'Emma Johnson',
      email: 'emma@example.com',
      phone: '+1987654321',
      status: LeadStatus.CONTACTED,
      source: LeadSource.REFERRAL,
      tags: ['honeymoon', 'luxury'],
      notes: 'Planning a honeymoon trip to Maldives',
      travelDetails: {
        destination: 'Maldives',
        departureDate: new Date(2023, 9, 5),
        returnDate: new Date(2023, 9, 15),
        budget: {
          currency: 'USD',
          value: 8000,
        },
        preferences: {
          accommodation: 'Overwater bungalow',
          specialRequests: 'Snorkeling, Spa, Romantic dinner',
        },
      },
      createdAt: new Date(2023, 5, 12),
      updatedAt: new Date(2023, 5, 15),
      assignedTo: 'agent-2',
      collaborators: ['agent-1'],
      aiScore: {
        value: 92,
      },
      isReturnCustomer: false,
    },
    {
      _id: 'lead-3',
      fullName: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+1122334455',
      status: LeadStatus.QUALIFIED,
      source: LeadSource.SOCIAL,
      tags: ['business', 'short-stay'],
      notes: 'Business trip to Tokyo, needs hotel near city center',
      travelDetails: {
        destination: 'Tokyo',
        departureDate: new Date(2023, 6, 1),
        returnDate: new Date(2023, 6, 5),
        budget: {
          currency: 'USD',
          value: 3000,
        },
        preferences: {
          accommodation: 'Business hotel',
          specialRequests: 'None',
        },
      },
      createdAt: new Date(2023, 5, 20),
      updatedAt: new Date(2023, 5, 22),
      assignedTo: 'agent-1',
      collaborators: [],
      aiScore: {
        value: 78,
      },
      isReturnCustomer: false,
    },
    {
      _id: 'lead-4',
      fullName: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+1555666777',
      status: LeadStatus.BOOKED,
      source: LeadSource.REFERRAL,
      tags: ['return-customer', 'luxury', 'anniversary'],
      notes:
        'Anniversary trip to Paris, returning customer who booked Bali last year',
      travelDetails: {
        destination: 'Paris',
        departureDate: new Date(2023, 7, 10),
        returnDate: new Date(2023, 7, 20),
        budget: {
          currency: 'USD',
          value: 9500,
        },
        preferences: {
          accommodation: 'Luxury hotel',
          specialRequests: 'Romantic dinner, Wine tasting',
        },
      },
      createdAt: new Date(2023, 5, 25),
      updatedAt: new Date(2023, 5, 28),
      assignedTo: 'agent-2',
      collaborators: [],
      aiScore: {
        value: 95,
      },
      isReturnCustomer: true,
    },
  ];
}

function generateMockTasks(): Task[] {
  return [
    {
      id: 'task-1',
      title: 'Follow up with John Smith',
      description: 'Send Hawaii package options',
      type: TaskType.EMAIL,
      priority: TaskPriority.HIGH,
      dueDate: new Date(2023, 5, 12),
      completed: false,
      leadId: 'lead-1',
      assignedTo: 'agent-1',
      createdAt: new Date(2023, 5, 10),
      updatedAt: new Date(2023, 5, 10),
    },
    {
      id: 'task-2',
      title: 'Call Emma regarding Maldives options',
      description: 'Discuss accommodation preferences',
      type: TaskType.CALL,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(2023, 5, 16),
      completed: false,
      leadId: 'lead-2',
      assignedTo: 'agent-2',
      createdAt: new Date(2023, 5, 15),
      updatedAt: new Date(2023, 5, 15),
    },
    {
      id: 'task-3',
      title: 'Book meeting with Michael',
      description: 'Discuss Tokyo business hotel options',
      type: TaskType.MEETING,
      priority: TaskPriority.LOW,
      dueDate: new Date(2023, 5, 25),
      completed: false,
      leadId: 'lead-3',
      assignedTo: 'agent-1',
      createdAt: new Date(2023, 5, 22),
      updatedAt: new Date(2023, 5, 22),
    },
    {
      id: 'task-4',
      title: 'Send anniversary package to Sarah',
      description: 'Include special Eiffel Tower dinner reservation option',
      type: TaskType.EMAIL,
      priority: TaskPriority.URGENT,
      dueDate: new Date(2023, 5, 8),
      completed: true,
      completedAt: new Date(2023, 5, 7),
      leadId: 'lead-4',
      assignedTo: 'agent-2',
      createdAt: new Date(2023, 5, 5),
      updatedAt: new Date(2023, 5, 7),
    },
    {
      id: 'task-5',
      title: 'Follow up with David about Orlando',
      description: 'Check if they need airport transfers',
      type: TaskType.CALL,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(2023, 6, 1),
      completed: false,
      leadId: 'lead-5',
      assignedTo: 'agent-1',
      createdAt: new Date(2023, 5, 26),
      updatedAt: new Date(2023, 5, 26),
    },
  ];
}

function generateMockCommunications(): Communication[] {
  return [
    {
      id: 'comm-1',
      leadId: 'lead-1',
      channel: CommunicationChannel.EMAIL,
      direction: 'incoming',
      content:
        "Hi, I'm interested in booking a family vacation to Hawaii this summer. Can you help?",
      sentAt: new Date(2023, 5, 10, 9, 30),
      sentBy: 'lead-1',
      aiSentiment: 0.8,
    },
    {
      id: 'comm-2',
      leadId: 'lead-1',
      channel: CommunicationChannel.EMAIL,
      direction: 'outgoing',
      content:
        "Hello John, I'd be happy to help you plan your Hawaii vacation! Could you please let me know your preferred travel dates and budget?",
      sentAt: new Date(2023, 5, 10, 11, 45),
      sentBy: 'agent-1',
      aiSentiment: 0.9,
    },
    {
      id: 'comm-3',
      leadId: 'lead-2',
      channel: CommunicationChannel.PHONE,
      direction: 'outgoing',
      content: 'Called to discuss honeymoon package options.',
      sentAt: new Date(2023, 5, 15, 14, 15),
      sentBy: 'agent-2',
      aiSentiment: 0.7,
    },
    {
      id: 'comm-4',
      leadId: 'lead-4',
      channel: CommunicationChannel.EMAIL,
      direction: 'incoming',
      content:
        "We're thinking of celebrating our anniversary in Paris this year. Since we loved our Bali trip you arranged last year, we wanted to book with you again.",
      sentAt: new Date(2023, 5, 5, 10, 20),
      sentBy: 'lead-4',
      aiSentiment: 0.9,
    },
    {
      id: 'comm-5',
      leadId: 'lead-5',
      channel: CommunicationChannel.WHATSAPP,
      direction: 'incoming',
      content:
        "Hi again! We're planning another family trip, this time to Orlando for the theme parks. Can you help us like you did for our NYC trip?",
      sentAt: new Date(2023, 5, 25, 16, 45),
      sentBy: 'lead-5',
      aiSentiment: 0.85,
    },
  ];
}

function generateMockBookings(): Booking[] {
  return [
    {
      id: 'booking-1',
      leadId: 'lead-2',
      status: 'confirmed',
      itinerary: {
        id: 'itinerary-1',
        name: 'Maldives Honeymoon Package',
        description: '7 nights at overwater bungalow with all-inclusive meals',
      },
      totalAmount: 8000,
      paidAmount: 2000,
      paymentStages: [
        {
          id: 'payment-1',
          name: 'Deposit',
          amount: 2000,
          dueDate: new Date(2023, 5, 20),
          paid: true,
          paidAt: new Date(2023, 5, 18),
        },
        {
          id: 'payment-2',
          name: 'Final Payment',
          amount: 6000,
          dueDate: new Date(2023, 8, 5),
          paid: false,
        },
      ],
      createdAt: new Date(2023, 5, 18),
      updatedAt: new Date(2023, 5, 18),
    },
    {
      id: 'booking-2',
      leadId: 'lead-4',
      status: 'completed',
      itinerary: {
        id: 'itinerary-2',
        name: 'Bali Luxury Retreat',
        description: '10 nights at private villa with spa treatments',
      },
      totalAmount: 7500,
      paidAmount: 7500,
      paymentStages: [
        {
          id: 'payment-3',
          name: 'Full Payment',
          amount: 7500,
          dueDate: new Date(2022, 4, 15),
          paid: true,
          paidAt: new Date(2022, 4, 10),
        },
      ],
      createdAt: new Date(2022, 3, 20),
      updatedAt: new Date(2022, 4, 10),
    },
    {
      id: 'booking-3',
      leadId: 'lead-5',
      status: 'completed',
      itinerary: {
        id: 'itinerary-3',
        name: 'New York City Family Tour',
        description: '5 nights at midtown hotel with Broadway show tickets',
      },
      totalAmount: 5800,
      paidAmount: 5800,
      paymentStages: [
        {
          id: 'payment-4',
          name: 'Deposit',
          amount: 1500,
          dueDate: new Date(2022, 7, 1),
          paid: true,
          paidAt: new Date(2022, 6, 28),
        },
        {
          id: 'payment-5',
          name: 'Final Payment',
          amount: 4300,
          dueDate: new Date(2022, 9, 10),
          paid: true,
          paidAt: new Date(2022, 9, 5),
        },
      ],
      createdAt: new Date(2022, 6, 15),
      updatedAt: new Date(2022, 9, 5),
    },
  ];
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Pages
import Layout from './components/crm/Layout';
import BookingFormPage from './features/crm/bookings/BookingFormPage';
import BookingsPage from './features/crm/bookings/BookingsPage';
import CommunicationPage from './features/crm/communication/CommunicationPage';
import MessageComposePage from './features/crm/communication/MessageComposePage';
import CrmDashboard from './features/crm/CrmDashboard';
import Home from './features/crm/Home';
import NotFound from './pages/NotFound';

// CRM module
import InsightsPage from './features/crm/insights/InsightsPage';
import LeadDetailPage from './features/crm/leads/LeadDetailPage';
import LeadFormPage from './features/crm/leads/LeadFormPage';
import LeadsPage from './features/crm/leads/LeadsPage';
import SegmentsPage from './features/crm/segments/SegmentsPage';
import TaskFormPage from './features/crm/tasks/TaskFormPage';
import TasksPage from './features/crm/tasks/TasksPage';

import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to='/crm' replace />} />

          {/* CRM Routes */}
          <Route
            path='/crm'
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path='/crm/dashboard'
            element={
              <Layout>
                <CrmDashboard />
              </Layout>
            }
          />
          <Route
            path='/crm/leads'
            element={
              <Layout>
                <LeadsPage />
              </Layout>
            }
          />
          <Route
            path='/crm/leads/:id'
            element={
              <Layout>
                <LeadDetailPage />
              </Layout>
            }
          />
          <Route
            path='/crm/leads/new'
            element={
              <Layout>
                <LeadFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/leads/:id/edit'
            element={
              <Layout>
                <LeadFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/communication'
            element={
              <Layout>
                <CommunicationPage />
              </Layout>
            }
          />
          <Route
            path='/crm/communication/new'
            element={
              <Layout>
                <MessageComposePage />
              </Layout>
            }
          />
          <Route
            path='/crm/communication/new/:leadId'
            element={
              <Layout>
                <MessageComposePage />
              </Layout>
            }
          />
          <Route
            path='/crm/tasks'
            element={
              <Layout>
                <TasksPage />
              </Layout>
            }
          />
          <Route
            path='/crm/tasks/new'
            element={
              <Layout>
                <TaskFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/tasks/new/:leadId'
            element={
              <Layout>
                <TaskFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/bookings'
            element={
              <Layout>
                <BookingsPage />
              </Layout>
            }
          />
          <Route
            path='/crm/bookings/new'
            element={
              <Layout>
                <BookingFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/bookings/new/:leadId'
            element={
              <Layout>
                <BookingFormPage />
              </Layout>
            }
          />
          <Route
            path='/crm/insights'
            element={
              <Layout>
                <InsightsPage />
              </Layout>
            }
          />
          <Route
            path='/crm/segments'
            element={
              <Layout>
                <SegmentsPage />
              </Layout>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';

// Lazy page imports
import { lazy } from 'react';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const StaffListPage = lazy(() => import('@/pages/staff/StaffListPage'));
const StaffDetailPage = lazy(() => import('@/pages/staff/StaffDetailPage'));
const StaffFormPage = lazy(() => import('@/pages/staff/StaffFormPage'));
const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('@/pages/projects/ProjectFormPage'));
const CVGeneratorPage = lazy(() => import('@/pages/cv/CVGeneratorPage'));
const CVPreviewPage = lazy(() => import('@/pages/cv/CVPreviewPage'));
const TemplatesPage = lazy(() => import('@/pages/templates/TemplatesPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/staff" element={<StaffListPage />} />
                <Route path="/staff/new" element={<StaffFormPage />} />
                <Route path="/staff/:id" element={<StaffDetailPage />} />
                <Route path="/staff/:id/edit" element={<StaffFormPage />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/new" element={<ProjectFormPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
                <Route path="/cv" element={<CVGeneratorPage />} />
                <Route path="/cv/preview/:staffId/:templateId" element={<CVPreviewPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

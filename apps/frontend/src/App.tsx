import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';

// Lazy page imports
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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

// Hoist fallback JSX outside App — static reference, never recreated on App renders
const PAGE_FALLBACK = (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin">
      <Loader2 className="w-8 h-8 text-accent" />
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <DashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/new"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/:id"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/:id/edit"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/new"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/:id/edit"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/cv"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <CVGeneratorPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/cv/preview/:staffId/:templateId"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <CVPreviewPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <TemplatesPage />
                    </Suspense>
                  }
                />
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

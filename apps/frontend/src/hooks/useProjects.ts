import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  CreateParticipationInput,
} from '@cv-generator/shared';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => api.get<{ data: Project[] }>('/projects').then((r) => r.data.data),
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.get<{ data: Project }>(`/projects/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      api.post<Project>('/projects', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectInput) =>
      api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useCreateParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParticipationInput) =>
      api.post('/participations', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      qc.invalidateQueries({ queryKey: ['staff', variables.staffId, 'participations'] });
    },
  });
}

export function useDeleteParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string; staffId: string }) =>
      api.delete(`/participations/${id}`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      qc.invalidateQueries({ queryKey: ['staff', variables.staffId, 'participations'] });
    },
  });
}

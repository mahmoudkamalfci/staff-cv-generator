import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Staff,
  StaffWithSkills,
  CreateStaffInput,
  UpdateStaffInput,
  CreateSkillInput,
  ResetPasswordInput,
} from '@cv-generator/shared';

export const staffKeys = {
  all: ['staff'] as const,
  detail: (id: string) => ['staff', id] as const,
  skills: (id: string) => ['staff', id, 'skills'] as const,
};

export function useStaffList() {
  return useQuery({
    queryKey: staffKeys.all,
    queryFn: () => api.get<{ data: Staff[] }>('/staff').then((r) => r.data.data),
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => api.get<{ data: StaffWithSkills }>(`/staff/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) =>
      api.post<{ data: Staff }>('/staff', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useUpdateStaff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStaffInput) =>
      api.patch<Staff>(`/staff/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: staffKeys.detail(id) });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useUploadStaffPhoto(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return api
        .post<{ photoUrl: string }>(`/staff/${staffId}/photo`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) });
      qc.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useAddSkill(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillInput) =>
      api.post(`/staff/${staffId}/skills`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
  });
}

export function useDeleteSkill(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => api.delete(`/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
  });
}

export function useStaffParticipations(staffId: string) {
  return useQuery({
    queryKey: ['staff', staffId, 'participations'],
    queryFn: () => api.get(`/staff/${staffId}/participations`).then((r) => r.data),
    enabled: !!staffId,
  });
}

export function useResetPassword(id: string) {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await api.post(`/staff/${id}/reset-password`, data);
      return response.data;
    },
  });
}

export function useStaffSuggestions() {
  return useMutation({
    mutationFn: (technologies: string[]) =>
      api
        .post<{
          data: (Staff & { matchedSkills: string[] })[];
        }>('/staff/suggestions', { technologies })
        .then((r) => r.data.data),
  });
}

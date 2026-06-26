import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVTemplate, CreateTemplateInput, UpdateTemplateInput } from '@cv-generator/shared';

export const templateKeys = {
  all: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
};

export function useTemplateList() {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: () => api.get<{ data: CVTemplate[] }>('/templates').then((r) => r.data.data),
  });
}

export function useTemplateDetail(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => api.get<{ data: CVTemplate }>(`/templates/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) =>
      api.post<{ data: CVTemplate }>('/templates', input).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      api.patch<{ data: CVTemplate }>(`/templates/${id}`, input).then((r) => r.data.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: templateKeys.all });
      qc.invalidateQueries({ queryKey: templateKeys.detail(id) });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

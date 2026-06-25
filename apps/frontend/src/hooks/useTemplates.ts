import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVTemplate } from '@cv-generator/shared';

export function useTemplateList() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<CVTemplate[]>('/templates').then((r) => r.data),
  });
}

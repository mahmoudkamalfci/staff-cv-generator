import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVData } from '@cv-generator/shared';

export const cvKeys = {
  all: ['cv'] as const,
  byStaff: (staffId: string) => ['cv', staffId] as const,
  detail: (staffId: string, templateId: string) => ['cv', staffId, templateId] as const,
};

export function useCVData(staffId: string, templateId: string) {
  return useQuery({
    queryKey: cvKeys.detail(staffId, templateId),
    queryFn: () => api.get<{ data: CVData }>(`/cv/${staffId}/${templateId}`).then((r) => r.data.data),
    enabled: !!staffId && !!templateId,
    staleTime: 0, // Always fresh — generates audit log on backend
  });
}

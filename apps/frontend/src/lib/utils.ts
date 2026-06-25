import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

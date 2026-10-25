import { CategoryId } from './places';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  icon: string; // Ionicons name
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'colleges', label: 'Colleges', icon: 'school', color: '#0E7FC0' },
  { id: 'labs', label: 'Classes & Labs', icon: 'flask', color: '#7A5BD6' },
  { id: 'dorms', label: 'Dorms', icon: 'bed', color: '#E07A3F' },
  { id: 'food', label: 'Food & Lounges', icon: 'restaurant', color: '#D64545' },
  { id: 'libraries', label: 'Libraries', icon: 'library', color: '#2E9E6B' },
  { id: 'services', label: 'Services', icon: 'business', color: '#0E5E7E' },
  { id: 'sports', label: 'Sports & Fun', icon: 'football', color: '#E8A317' },
  { id: 'events', label: 'Halls & Events', icon: 'ticket', color: '#C2447F' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryInfo
>;

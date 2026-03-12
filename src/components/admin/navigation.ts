import type { SvgIconComponent } from '@mui/icons-material';
import {
  Dashboard,
  Event,
  Paid,
  People,
  Receipt,
  Settings,
} from '@mui/icons-material';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

export const adminNavigation: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Dashboard,
  },
  {
    label: 'Instructors',
    href: '/instructors',
    icon: People,
    children: [
      { label: '강사 운영 리스트', href: '/instructors/list' },
      { label: '전체 강사 DB', href: '/instructors/db' },
    ],
  },
  {
    label: 'Schedules',
    href: '/schedules',
    icon: Event,
    children: [
      { label: '수업 관리', href: '/schedules/lessons' },
      { label: 'GPS 모니터링', href: '/schedules/gps' },
      { label: '수업지 관리', href: '/schedules/locations' },
    ],
  },
  {
    label: 'Contracts',
    href: '/contracts',
    icon: Receipt,
  },
  {
    label: 'Settlements',
    href: '/settlements',
    icon: Paid,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

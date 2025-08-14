export interface NotificationsProps {
  setActiveTab?: (tab: string) => void;
}

export type NotificationType = 
  | 'like'
  | 'comment' 
  | 'follow'
  | 'mint'
  | 'curate'
  | 'message'
  | 'reward'
  | 'transfer';

export interface NotificationActor {
  id: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

export interface NotificationTarget {
  id: string;
  name?: string;
  image?: string;
  type: 'sticker' | 'collection' | 'user' | 'comment';
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actor: NotificationActor;
  target?: NotificationTarget;
  metadata?: Record<string, any>;
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
}

export interface NotificationsState {
  notifications: Notification[];
  groups: NotificationGroup[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filter: NotificationType | 'all';
  unreadCount: number;
}

export interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onUnread: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export interface NotificationFilterProps {
  currentFilter: NotificationType | 'all';
  onFilterChange: (filter: NotificationType | 'all') => void;
  unreadCounts: Record<NotificationType | 'all', number>;
}

export interface NotificationGroupProps {
  group: NotificationGroup;
  onNotificationRead: (id: string) => void;
  onNotificationUnread: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

// Time periods for grouping
export type TimePeriod = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'older';

// Filter options
export const NOTIFICATION_FILTERS = [
  { id: 'all', label: 'All', icon: 'notifications' },
  { id: 'like', label: 'Likes', icon: 'heart' },
  { id: 'comment', label: 'Comments', icon: 'message' },
  { id: 'follow', label: 'Follows', icon: 'profile' },
  { id: 'mint', label: 'Mints', icon: 'star' },
  { id: 'curate', label: 'Curates', icon: 'check' },
] as const;

// Notification type configurations
export const NOTIFICATION_CONFIG = {
  like: {
    icon: 'heart',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  comment: {
    icon: 'message',
    color: 'text-blue-500', 
    bgColor: 'bg-blue-100',
  },
  follow: {
    icon: 'profile',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  mint: {
    icon: 'star',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
  },
  curate: {
    icon: 'check',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  message: {
    icon: 'message',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  reward: {
    icon: 'star',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
  transfer: {
    icon: 'arrow-right',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
  },
} as const;
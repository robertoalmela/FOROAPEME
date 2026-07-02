export interface User {
  id: string;
  phoneNumber: string;
  phoneVerified: boolean;
  telegramId?: string;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  pollType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'YES_NO';
  isAnonymous: boolean;
  allowMultiple: boolean;
  maxChoices?: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  options: PollOption[];
  _count?: { votes: number };
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  order: number;
}

export interface PollResults {
  poll: {
    id: string;
    title: string;
    description: string;
    pollType: string;
    status: string;
    isAnonymous: boolean;
    startDate?: string;
    endDate?: string;
  };
  results: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  totalVoters: number;
  totalVotes: number;
  userHasVoted: boolean;
  userVote: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  _count?: { threads: number };
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  tags: { tag: { id: string; name: string; slug: string } }[];
  _count?: { replies: number };
}

export interface Reply {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  threadId: string;
  parentId?: string;
  parent?: {
    id: string;
    content: string;
    author: { firstName?: string; lastName?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_POLL' | 'POLL_REMINDER' | 'POLL_CLOSED' | 'THREAD_REPLY' | 'MENTION' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentViaApp: boolean;
  sentViaTelegram: boolean;
  sentViaSMS: boolean;
  createdAt: string;
  readAt?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  notifyNewPoll: boolean;
  notifyPollReminder: boolean;
  notifyThreadReply: boolean;
  notifyMention: boolean;
  preferTelegram: boolean;
  preferSMS: boolean;
  showProfile: boolean;
  showActivity: boolean;
}

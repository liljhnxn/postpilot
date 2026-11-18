export type ConnectionStatus = 'connected' | 'expired' | 'revoked';

export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'partially_published'
  | 'published'
  | 'failed';

export type TargetStatus =
  | 'pending'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export type BatchStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial_failure'
  | 'failed';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface XAccount {
  id: string;
  user_id: string;
  x_user_id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  connection_status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  // Note: Tokens are never exposed to the frontend
  published_count?: number;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  status: PostStatus;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
  targets?: PostTarget[];
}

export interface PostTarget {
  id: string;
  post_id: string;
  user_id: string;
  x_account_id: string;
  batch_id?: string | null;
  status: TargetStatus;
  scheduled_at: string | null;
  published_at: string | null;
  x_post_id: string | null;
  error_message: string | null;
  retry_count: number;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
  x_account?: XAccount;
  post?: Post;
}

export interface PublishingBatch {
  id: string;
  user_id: string;
  status: BatchStatus;
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  created_at: string;
  updated_at: string;
}

// Composer-specific types
export interface ComposerItem {
  id: string; // client temporary ID
  content: string;
  selectedAccountIds: string[];
  media?: string[];
}

export type ScheduleIntervalOption =
  | 'none'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '3h'
  | 'custom';

export interface BulkPublishPayload {
  posts: {
    content: string;
    accountIds: string[];
    scheduledAt?: string | null; // ISO string
    media?: string[];
  }[];
  isScheduled?: boolean;
}

export interface DashboardStats {
  connectedAccounts: number;
  totalPublishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
}

export interface RecentActivityItem {
  id: string;
  content: string;
  username: string;
  accountDisplayName: string;
  status: TargetStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  xPostId: string | null;
}


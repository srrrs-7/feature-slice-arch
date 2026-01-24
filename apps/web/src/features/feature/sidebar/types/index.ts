/**
 * Navigation item for sidebar navigation
 */
export interface NavigationItem {
  /** Route path */
  href: string;
  /** Display label */
  label: string;
  /** SVG path d attribute */
  iconPath: string;
  /** SVG viewBox (defaults to "0 0 20 20") */
  iconViewBox?: string;
  /** Fill rule for SVG path */
  iconFillRule?: "evenodd" | "nonzero";
}

/**
 * AppSidebar component props
 */
export interface AppSidebarProps {
  /** Current route path for active highlighting */
  currentPath?: string;
  /** Whether mobile drawer is open (controlled by parent) */
  open?: boolean;
  /** Whether desktop sidebar is collapsed (icon-only mode) */
  collapsed?: boolean;
  /** Callback when sidebar should close */
  onClose?: () => void;
  /** Callback when collapse state should toggle */
  onToggleCollapse?: () => void;
}

/**
 * User info for sidebar footer (future use)
 */
export interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  avatarInitial?: string;
}

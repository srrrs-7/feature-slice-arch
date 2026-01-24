/**
 * Navigation item for header navigation
 */
export interface NavigationItem {
  /** Route path */
  href: string;
  /** Display label */
  label: string;
  /** SVG path d attribute */
  iconPath?: string;
}

/**
 * AppHeader component props
 */
export interface AppHeaderProps {
  /** Current route path for active highlighting */
  currentPath?: string;
  /** Callback when mobile menu button is clicked */
  onMenuClick?: () => void;
}

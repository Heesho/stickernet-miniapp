export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
}

export type IconName =
  | "heart"
  | "star"
  | "check"
  | "plus"
  | "arrow-right"
  | "home"
  | "search"
  | "create"
  | "notifications"
  | "profile"
  | "message"
  | "warning"
  | "wallet"
  | "deposit"
  | "close"
  | "alert";
export type IconSize = "sm" | "md" | "lg";

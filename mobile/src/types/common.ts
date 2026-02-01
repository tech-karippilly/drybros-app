/**
 * Common types used throughout the app
 */

export interface BaseComponentProps {
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

export interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

export interface BadgeProps {
  /** Badge label */
  label: string;
  /** success | pending | rejected | onProcess */
  variant: 'success' | 'pending' | 'rejected' | 'onProcess';
  /** Container width: '100%' or number */
  width?: number | '100%';
  /** Container height: '100%' or number */
  height?: number | '100%';
  style?: object;
}

export interface IconCircleProps {
  /** Icon name (MaterialCommunityIcons) */
  icon: string;
  /** Outer circle diameter */
  size?: number;
  /** Blur intensity for outer circle */
  outerBlurIntensity?: number;
  /** Blur intensity for middle circle */
  middleBlurIntensity?: number;
  /** Inner circle solid background color */
  innerColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Icon size */
  iconSize?: number;
  /** Blur tint: 'light' | 'dark' | 'default' */
  blurTint?: 'light' | 'dark' | 'default';
  style?: object;
}

export interface SwipeButtonProps {
  /** Label text (e.g. "Swipe to confirm") */
  label: string;
  /** Called when user swipes to the end */
  onSwipeComplete?: () => void;
  /** Container width: number or '100%' */
  width?: number | '100%';
  /** Container height: number or '100%' */
  height?: number | '100%';
  /** Track background color */
  trackColor?: string;
  /** Thumb background color */
  thumbColor?: string;
  /** Thumb icon name (MaterialCommunityIcons) */
  thumbIconName?: string;
  /** Thumb icon color */
  thumbIconColor?: string;
  /** Gradient colors for label [start, end] */
  gradientColors?: readonly [string, string, ...string[]];
  /** Disabled state (no drag) */
  disabled?: boolean;
  style?: object;
}

export interface PrimaryButtonProps {
  /** Button label */
  label: string;
  onPress: () => void;
  /** Background color (from props) */
  backgroundColor: string;
  /** Label text color */
  textColor?: string;
  /** Container width: '100%' or number */
  width?: number | '100%';
  /** Container height: '100%' or number */
  height?: number | '100%';
  /** Optional icon name (MaterialCommunityIcons); when set, shows icon + label with gap */
  icon?: string;
  /** Icon color (defaults to textColor) */
  iconColor?: string;
  disabled?: boolean;
  style?: object;
}
import type { ThemeColors } from '@/shared/styles/theme';

export type StatusToneKind = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export interface StatusToneColors {
  background: string;
  border: string;
  text: string;
}

export function getStatusToneColors(colors: ThemeColors, kind: StatusToneKind): StatusToneColors {
  switch (kind) {
    case 'success':
      return { background: colors.success, border: colors.success, text: colors.onSuccess };
    case 'warning':
      return { background: colors.warning, border: colors.warning, text: colors.onWarning };
    case 'danger':
      return { background: colors.danger, border: colors.danger, text: colors.onDanger };
    case 'accent':
      return { background: colors.primary, border: colors.primary, text: colors.onPrimary };
    case 'neutral':
    default:
      return { background: colors.background, border: colors.border, text: colors.text };
  }
}

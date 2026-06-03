import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

export function showToast(type: ToastType, text1: string, text2?: string) {
  try {
    Toast.show({ type, text1, text2, position: 'top' });
  } catch (e) {
    // Silently ignore if Toast is not mounted
  }
}

export const toast = {
  info: (t1: string, t2?: string) => showToast('info', t1, t2),
  success: (t1: string, t2?: string) => showToast('success', t1, t2),
  error: (t1: string, t2?: string) => showToast('error', t1, t2),
};

export default Toast;

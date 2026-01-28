export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

import { toast } from "sonner";

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (toastId?: string | number) => toast.dismiss(toastId),
};

// Specific toast functions for common actions
export const leadToasts = {
  created: (leadName: string) =>
    showToast.success(`Lead "${leadName}" created successfully`),
  updated: (leadName: string) =>
    showToast.success(`Lead "${leadName}" updated successfully`),
  deleted: (leadName: string) =>
    showToast.success(`Lead "${leadName}" deleted successfully`),
  error: (action: string) => showToast.error(`Failed to ${action} lead`),
};

export const userToasts = {
  created: (userName: string) =>
    showToast.success(`User "${userName}" created successfully`),
  updated: (userName: string) =>
    showToast.success(`User "${userName}" updated successfully`),
  deleted: (userName: string) =>
    showToast.success(`User "${userName}" deactivated successfully`),
  error: (action: string) => showToast.error(`Failed to ${action} user`),
};

export const reviewToasts = {
  approved: (leadName: string) =>
    showToast.success(`Lead "${leadName}" approved`),
  rejected: (leadName: string) =>
    showToast.success(`Lead "${leadName}" rejected`),
  verified: (leadName: string) =>
    showToast.success(`Lead "${leadName}" verified`),
  invalidated: (leadName: string) =>
    showToast.success(`Lead "${leadName}" marked as invalid`),
};

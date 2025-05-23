// src/types.ts
export interface CheckinData {
  circle: string;
  message: string;
  goalId?: string | null;
  goal?: {
    name: string;
    description: string;
    dueDate?: string;
    completed: boolean;
  };
}

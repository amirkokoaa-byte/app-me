
export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface Expense {
  id: string;
  name: string;
  value: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  userId: string;
}

export interface Commitment {
  id: string;
  type: string;
  totalValue: number;
  installmentsCount: number;
  paidAmount: number;
  remainingAmount: number;
  duration: string;
  date: string;
  userId: string;
  isCompleted: boolean;
}

export interface MonthlyRecord {
  id: string;
  monthName: string;
  salary: number;
  totalExpenses: number;
  expenses: Expense[];
  date: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  text: string;
  timestamp: string;
}

export enum AppTab {
  MONTHLY_EXPENSES = 'monthly_expenses',
  COMMITMENTS = 'commitments',
  PREVIOUS_MONTHS = 'previous_months',
  SETTINGS = 'settings'
}

export type ThemeType = 'light' | 'dark' | 'midnight' | 'emerald';

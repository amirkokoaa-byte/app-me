
export interface Expense {
  id: string;
  name: string;
  value: number;
  dueDate: string;
  category: string;
}

export interface Commitment {
  id: string;
  type: string;
  value: number;
  description: string;
}

export interface MonthlyRecord {
  id: string;
  monthName: string;
  salary: number;
  totalExpenses: number;
  expenses: Expense[];
  date: string;
}

export enum AppTab {
  MONTHLY_EXPENSES = 'monthly_expenses',
  COMMITMENTS = 'commitments',
  PREVIOUS_MONTHS = 'previous_months'
}

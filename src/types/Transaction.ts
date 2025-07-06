
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Other Income'
];

export const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Insurance',
  'Gifts',
  'Other Expenses'
];

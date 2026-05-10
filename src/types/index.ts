// Database types matching Supabase schema

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category_id: string | null;
  transaction_date: string;
  is_expense: boolean;
  card_last_digits: string | null;
  is_installment: boolean;
  installment_total: number | null;
  created_at: string;
  category?: Category;
}

export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: 'fixed' | 'variable' | 'real_estate' | 'crypto' | 'other';
  value: number;
  income_rate: number;
  created_at: string;
}

export interface CardSettings {
  id: string;
  user_id: string;
  card_name: string;
  closing_day: number;
  due_day: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  card_settings_id: string;
  invoice_month: number;
  invoice_year: number;
  total_amount: number;
  file_url: string;
  uploaded_at: string;
}

// Dashboard summary types
export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
  monthlyComparison: MonthlyData[];
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  total: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

// Financial Goals
export type GoalCategory =
  | 'emergency_fund'
  | 'travel'
  | 'real_estate'
  | 'vehicle'
  | 'education'
  | 'retirement'
  | 'other'

export interface Goal {
  id: string
  user_id: string
  name: string
  description: string | null
  category: GoalCategory
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  icon: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  contribution_date: string
  notes: string | null
  created_at: string
}

export interface GoalFormData {
  name: string
  description: string
  category: GoalCategory
  target_amount: number
  current_amount: number
  deadline: string
  color: string
  icon: string
}

export interface GoalContributionFormData {
  goal_id: string
  amount: number
  contribution_date: string
  notes: string
}

// AI Consultant suggestions
export interface AISuggestion {
  id: string;
  category: string;
  icon: string;
  title: string;
  description: string;
  potentialSavings: number;
  severity: 'high' | 'medium' | 'low';
}

// Form types
export interface TransactionFormData {
  description: string;
  amount: number;
  category_id: string | null;
  transaction_date: string;
  is_expense: boolean;
  card_last_digits?: string;
  is_installment?: boolean;
  installment_total?: number;
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export interface IncomeFormData {
  source: string;
  amount: number;
  month: number;
  year: number;
}

export interface InvestmentFormData {
  name: string;
  type: 'fixed' | 'variable' | 'real_estate' | 'crypto' | 'other';
  value: number;
  income_rate: number;
}

export interface CardSettingsFormData {
  card_name: string;
  closing_day: number;
  due_day: number;
}
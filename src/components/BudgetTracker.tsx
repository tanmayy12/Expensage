import { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle, Trash2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, expenseCategories } from '@/types/Transaction';

interface BudgetTrackerProps {
  transactions: Transaction[];
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
}

const BudgetTracker = ({ transactions }: BudgetTrackerProps) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudget, setNewBudget] = useState<{
    category: string;
    amount: string;
    period: 'monthly' | 'weekly' | 'yearly';
  }>({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editBudgetData, setEditBudgetData] = useState<{ amount: string; period: 'monthly' | 'weekly' | 'yearly' }>({ amount: '', period: 'monthly' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch budgets from backend
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('jwt');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/budgets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch budgets');
        const data = await res.json();
        setBudgets(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching budgets');
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  // Add budget to backend
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.category || !newBudget.amount) return;
    // Prevent duplicate category+period
    if (budgets.some(b => b.category === newBudget.category && b.period === newBudget.period)) {
      setError('A budget for this category and period already exists.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: newBudget.category,
          amount: parseFloat(newBudget.amount),
          period: newBudget.period,
        }),
      });
      if (!res.ok) throw new Error('Failed to add budget');
      const data = await res.json();
      // Place the new budget at the top
      setBudgets(prev => [data, ...prev]);
      setNewBudget({ category: '', amount: '', period: 'monthly' });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Error adding budget');
    } finally {
      setLoading(false);
    }
  };

  // Delete budget handler
  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete budget');
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error deleting budget');
    } finally {
      setLoading(false);
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getBudgetColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'exceeded': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  // Compute spent for each budget based on current transactions and period
  const budgetsWithSpent = budgets.map(budget => {
    // Only count expenses for this category and period
    let filteredTxns = transactions.filter(
      t => t.type === 'expense' && t.category === budget.category
    );

    // Filter by period
    const now = new Date();
    let periodStart: Date;
    if (budget.period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (budget.period === 'weekly') {
      const day = now.getDay();
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - day);
    } else if (budget.period === 'yearly') {
      periodStart = new Date(now.getFullYear(), 0, 1);
    } else {
      periodStart = new Date(0); // fallback: all time
    }

    filteredTxns = filteredTxns.filter(t => new Date(t.date) >= periodStart);
    const spent = filteredTxns.reduce((sum, t) => sum + t.amount, 0);
    return { ...budget, spent };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-white">Budget Tracker</h2>
        </div>
        <Button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {showAddForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {showAddForm ? 'Close' : 'Add Budget'}
        </Button>
      </div>

      {showAddForm && (() => {
        try {
          if (!expenseCategories || !Array.isArray(expenseCategories) || expenseCategories.length === 0) {
            return <div className="text-red-600">No categories available. Please add categories in your code.</div>;
          }
          return (
            <Card className="glass-card mb-4">
              <CardHeader>
                <CardTitle>Add New Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBudget} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newBudget.category || ''} onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Amount</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={newBudget.amount || ''}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.]/g, '') }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select value={newBudget.period || 'monthly'} onValueChange={(value: 'monthly' | 'weekly' | 'yearly') => setNewBudget(prev => ({ ...prev, period: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Budget'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          );
        } catch (formError) {
          return <div className="text-red-600">An error occurred in the add form. Please reload the page or contact support.</div>;
        }
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {budgetsWithSpent.map((budget) => {
          const status = getBudgetStatus(budget);
          const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
          const remaining = Math.max(budget.amount - budget.spent, 0);

          return (
            <Card key={budget.id} className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg font-bold text-white">{budget.category}</CardTitle>
                    <Badge 
                      variant={getBadgeVariant(status)}
                      className={
                        status === 'exceeded' ? 'bg-red-600 text-white' :
                        status === 'warning' ? 'bg-yellow-400 text-black' :
                        'bg-green-600 text-white'
                      }
                    >
                      {status === 'exceeded' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {status === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {status === 'exceeded' ? 'Over Budget' : status === 'warning' ? 'Warning' : 'On Track'}
                    </Badge>
                  </div>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeleteBudget(budget.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Spent</span>
                    <span className={getBudgetColor(status)}>
                    ₹{(budget.spent ?? 0).toFixed(2)} / ₹{(budget.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={isNaN(percentage) ? 0 : percentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>{isNaN(percentage) ? '0.0' : percentage.toFixed(1)}% used</span>
                    <span>₹{isNaN(remaining) ? '0.00' : remaining.toFixed(2)} remaining</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Period</span>
                    <Badge variant="outline" className="capitalize">
                      {budget.period}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card className="glass-card text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No budgets set</h3>
            <p className="text-gray-400 mb-4">
              Create your first budget to start tracking your spending goals
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetTracker;

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Transaction } from '@/types/Transaction';

interface ExpenseChartProps {
  transactions: Transaction[];
}

const ExpenseChart = ({ transactions }: ExpenseChartProps) => {
  // Prepare data for pie chart (expenses by category)
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Prepare data for bar chart (income vs expenses by category)
  const allCategories = [...new Set(transactions.map(t => t.category))];
  const barData = allCategories.map(category => {
    const income = transactions
      .filter(t => t.type === 'income' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      category: category.length > 12 ? category.substring(0, 12) + '...' : category,
      income,
      expense,
    };
  }).filter(item => item.income > 0 || item.expense > 0);

  const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
  ];

  const totalExpenses = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5"/>
          Expense Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 h-full flex flex-col justify-between">
        {pieData.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p>No expense data to display</p>
            <p className="text-sm">Add some expenses to see the analysis</p>
          </div>
        ) : (
          <>
            {/* Pie Chart Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Expenses by Category
              </h3>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Amount']} />
                    <Legend 
                      formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart Section */}
            {barData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-7 mt-3">
                  Income vs Expenses by Category
                </h3>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid stroke="gray" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                      <Bar dataKey="income" fill="#22c55e" name="Income" />
                      <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="glass-card border border-white/10 bg-card/80 shadow-lg p-4 rounded-xl mt-4">
              <h3 className="text-sm font-medium text-white mb-2">
                Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-100">Total Categories:</span>
                  <span className="ml-2 font-medium text-white">{pieData.length}</span>
                </div>
                <div>
                  <span className="text-gray-100">Total Expenses:</span>
                  <span className="ml-2 font-medium text-red-400">
                    ₹{totalExpenses.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;

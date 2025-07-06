import { Brain, TrendingUp, AlertCircle, Target, Lightbulb, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Transaction } from '@/types/Transaction';

interface FinancialAdvisorProps {
  transactions: Transaction[];
}

const FinancialAdvisor = ({ transactions }: FinancialAdvisorProps) => {
  // Analyze spending patterns
  const analyzeSpending = () => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categorySpending = expenses.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending).sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalExpenses,
      categorySpending,
      topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
      avgTransaction: expenses.length > 0 ? totalExpenses / expenses.length : 0
    };
  };

  const analysis = analyzeSpending();

  const insights = [
    {
      id: 1,
      type: 'warning',
      title: 'High Spending Alert',
      message: `You've spent ₹${analysis.topCategory?.amount.toFixed(2) || '0.00'} on ${analysis.topCategory?.category || 'expenses'} this month. Consider setting a budget limit.`,
      action: 'Set Budget',
      priority: 'high'
    },
    {
      id: 2,
      type: 'tip',
      title: 'Savings Opportunity',
      message: 'Based on your spending pattern, you could save ₹200/month by reducing dining out expenses by 30%.',
      action: 'View Plan',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'goal',
      title: 'Emergency Fund',
      message: 'Aim to save 3-6 months of expenses. Based on your current spending, target ₹3,000-₹6,000.',
      action: 'Start Saving',
      priority: 'low'
    },
    {
      id: 4,
      type: 'insight',
      title: 'Spending Trend',
      message: 'Your average transaction is ₹' + analysis.avgTransaction.toFixed(2) + '. Small purchases add up quickly!',
      action: 'Track Daily',
      priority: 'medium'
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'tip': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'goal': return <Target className="h-5 w-5 text-blue-500" />;
      case 'insight': return <TrendingUp className="h-5 w-5 text-green-500" />;
      default: return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-2 mt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-white">AI Financial Advisor</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Powered by AI
          </Badge>
        </div>
        <p className="text-gray-500">AI Advisor will be available soon...</p>
      </div>
      <div className="mt-8">
        <img
          src="/aiadv.png"
          alt="AI Advisor Screenshot"
          className="rounded-2xl shadow-lg max-w-full h-auto"
        />
      </div>
    </div>
  );
};

export default FinancialAdvisor;

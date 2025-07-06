import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AddTransactionModal from '@/components/AddTransactionModal';
import ExpenseChart from '@/components/ExpenseChart';
import TransactionsList from '@/components/TransactionsList';
import BudgetTracker from '@/components/BudgetTracker';
import SubscriptionManager from '@/components/SubscriptionManager';
import GroupExpenses from '@/components/GroupExpenses';
import LocationInsights from '@/components/LocationInsights';
import FinancialAdvisor from '@/components/FinancialAdvisor';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import GlobalBackground from '@/components/ui/GlobalBackground';
import { Transaction, incomeCategories, expenseCategories } from '@/types/Transaction';
import { ChevronDown, ChevronUp, LayoutDashboard, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const features = [
  {
    title: 'Smart Expense Tracking',
    desc: 'Automatically categorize and track your expenses with AI-powered technology. Connect your bank accounts for seamless monitoring.',
  },
  {
    title: 'Budget Management',
    desc: 'Set personalized budgets for different categories and get real-time alerts when you\'re approaching your limits.',
  },
  {
    title: 'Financial Insights',
    desc: 'Get detailed analytics and insights about your spending patterns with beautiful charts and reports.',
  },
  {
    title: 'Goal Setting',
    desc: 'Set and track financial goals, whether it\'s saving for a vacation, paying off debt, or building an emergency fund.',
  },
  {
    title: 'Multi-Device Sync',
    desc: 'Access your financial data anywhere, anytime. Seamlessly sync across all your devices with real-time updates.',
  },
  {
    title: 'Security First',
    desc: 'Bank-level security with 256-bit encryption. Your financial data is protected with the highest security standards.',
  },
];

const dateOptions = [
  { label: 'Last 10 Transactions', value: 'last10' },
  { label: 'Last 1 Month', value: '1m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
];

const allCategories = [...incomeCategories, ...expenseCategories];

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDropdown, setFilterDropdown] = useState<'none' | 'date' | 'category'>('none');
  const [dateFilter, setDateFilter] = useState('last10');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();

  const token = localStorage.getItem('jwt');
  const isAuthenticated = !!token;

  // Fetch transactions for the logged-in user
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      fetch('http://localhost:4000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setTransactions(
            data.map((t: any) => ({ ...t, date: new Date(t.date) }))
          );
        })
        .catch(err => setError('Failed to fetch transactions'))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, token]);

  // Add transaction handler
  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setLoading(true);
    fetch('http://localhost:4000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transaction),
    })
      .then(res => res.json())
      .then(newTxn => {
        setTransactions(prev => [
          { ...newTxn, date: new Date(newTxn.date) },
          ...prev,
        ]);
        setIsAddModalOpen(false);
      })
      .catch(() => setError('Failed to add transaction'))
      .finally(() => setLoading(false));
  };

  // Delete transaction handler
  const handleDeleteTransaction = (id: string) => {
    setLoading(true);
    fetch(`http://localhost:4000/api/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setTransactions(prev => prev.filter(t => t.id !== id));
      })
      .catch(() => setError('Failed to delete transaction'))
      .finally(() => setLoading(false));
  };

  // Update transaction handler
  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    setLoading(true);
    fetch(`http://localhost:4000/api/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated),
    })
      .then(res => res.json())
      .then(updatedTxn => {
        setTransactions(prev =>
          prev.map(t => (t.id === id ? { ...updatedTxn, date: new Date(updatedTxn.date) } : t))
        );
      })
      .catch(() => setError('Failed to update transaction'))
      .finally(() => setLoading(false));
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.location.reload();
  };

  // Filtering logic
  const filteredTransactions = useMemo(() => {
    let txns = [...transactions];
    // Category filter
    if (categoryFilter !== 'all') {
      txns = txns.filter(t => t.category === categoryFilter);
    }
    // Date filter
    const now = new Date();
    if (dateFilter === 'last10') {
      txns = txns.slice(0, 10);
    } else if (dateFilter === '1m') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      txns = txns.filter(t => t.date >= oneMonthAgo);
    } else if (dateFilter === '3m') {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      txns = txns.filter(t => t.date >= threeMonthsAgo);
    } else if (dateFilter === '6m') {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      txns = txns.filter(t => t.date >= sixMonthsAgo);
    }
    return txns;
  }, [transactions, dateFilter, categoryFilter]);

  // Summary calculations
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <GlobalBackground />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Navigation
            onLogout={handleLogout}
            onAddTransaction={() => setIsAddModalOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <div className="pt-20 pb-8 px-2 md:px-8 max-w-7xl mx-auto w-full flex-1">
            <TabsContent value="dashboard">
              {/* Top bar: Dashboard title (left), Add Transaction & Filters (right) */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                {/* Dashboard title with icon */}
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                </div>
                <div className="flex flex-row gap-3 w-full md:w-auto justify-end">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    + Add Transaction
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setFilterOpen(f => !f);
                        setFilterDropdown('none');
                      }}
                    >
                      Filters <ChevronDown className="h-4 w-4" />
                    </Button>
                    {filterOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#23233a] rounded-lg shadow-lg z-50 p-4 border border-white/10">
                        {/* Filter options: By Date and By Category */}
                        <div className="flex flex-col gap-2">
                          <Select
                            value={dateFilter}
                            onValueChange={v => { setDateFilter(v); setFilterOpen(false); setFilterDropdown('none'); }}
                          >
                            <SelectTrigger className="w-full flex justify-between items-center">
                              <span>By Date</span>
                            </SelectTrigger>
                            <SelectContent>
                              {dateOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={categoryFilter}
                            onValueChange={v => { setCategoryFilter(v); setFilterOpen(false); setFilterDropdown('none'); }}
                          >
                            <SelectTrigger className="w-full flex justify-between items-center">
                              <span>By Category</span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {incomeCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                              {expenseCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="glass-card relative">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-green-400">Total Income</CardTitle>
                    <TrendingUp className="h-6 w-6 text-green-400 opacity-80 ml-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white-400">₹{totalIncome.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card relative">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-red-400">Total Expense</CardTitle>
                    <TrendingDown className="h-6 w-6 text-red-400 opacity-80 ml-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white-400">₹{totalExpense.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card relative">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-blue-400">Balance</CardTitle>
                    <DollarSign className="h-6 w-6 text-blue-400 opacity-80 ml-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white-400">₹{balance.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>
              {/* Main content: Expense Analysis (left), Recent Transactions (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 h-full">
                    <ExpenseChart transactions={filteredTransactions} />
                  </div>
                </div>
                <div className="w-full">
                  <TransactionsList
                    transactions={filteredTransactions}
                    onDelete={handleDeleteTransaction}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="budgets">
              <BudgetTracker transactions={transactions} />
            </TabsContent>
            <TabsContent value="subscriptions">
              <SubscriptionManager />
            </TabsContent>
            <TabsContent value="groups">
              <GroupExpenses />
            </TabsContent>
            <TabsContent value="charts">
              {/* Analytics Title */}
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-white">Analytics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex-1 h-full">
                  <ExpenseChart transactions={filteredTransactions} />
                </div>
                <div className="flex-1 h-full">
                  <Card className="glass-card w-full h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <BarChart className="h-6 w-6 text-white-600" />
                        <CardTitle className="flex items-center gap-2">Monthly Trends</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm font-medium text-gray-300 mb-4 py-4">
                      Advanced Analytics coming soon...
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="insights">
              <LocationInsights />
            </TabsContent>
            <TabsContent value="advisor">
              <FinancialAdvisor transactions={transactions} />
            </TabsContent>
          </div>
        </Tabs>
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTransaction}
        />
      </div>
    );
  }

    return (
    <div className="min-h-screen w-full flex flex-col">
      <GlobalBackground />
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-[60vh] pt-12 pb-24 px-4">
        {/* Nav Bar */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-8 py-6 z-10">
          <div className="text-lg px-12 font-bold text-blue-400 tracking-tight" style={{ fontFamily: 'Cambria, Cochin, Georgia, Times, \"Times New Roman\", serif'}}>Expensage</div>
          <div className="flex gap-4 items-center">
              <Button 
              variant="outline"
              className="rounded-full px-6 py-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => setIsAuthModalOpen(true)}
            >
              Contact
            </Button>
            <Button
              variant="ghost"
              className="rounded-full px-6 py-2 text-white border border-white/20 hover:bg-white/10"
              onClick={() => navigate('/auth')}
            >
              Sign In
              </Button>
          </div>
        </div>
        {/* Headline */}
        <div className="z-10 mt-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Cambria, Cochin, Georgia, Times, \"Times New Roman\", serif' }}>
            Take Control of Your <span className="text-blue-400">Financial</span> <span className="text-purple-400">Future</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Track expenses, set budgets, and achieve your financial goals with our intelligent expense tracking platform. Simple, powerful, and designed for everyone.
          </p>
                  <Button
            className="rounded-full px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            onClick={() => setIsAuthModalOpen(true)}
                  >
            Start Your Free Trial
                  </Button>
                              </div>
                              </div>
      {/* Features Section */}
      <div className="relative z-10 mt-32 px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Everything You Need to <span className="text-purple-400">Master Your Finances</span>
          </h2>
          <p className="text-slate-300 mt-2 max-w-xl mx-auto">
            Powerful features designed to make expense tracking effortless and financial management a breeze.
          </p>
                              </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-black/80 rounded-2xl p-6 shadow-lg border border-white/10 min-h-[180px] flex flex-col">
              <div className="font-bold text-white text-lg mb-2">{f.title}</div>
              <div className="text-slate-300 text-sm">{f.desc}</div>
                              </div>
          ))}
                          </div>
                      </div>
      {/* CTA Gradient Section */}
      <div className="mt-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 py-16 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Financial Life?</h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of users who have already taken control of their finances. Start your free trial today and see the difference in just one week.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button
            className="rounded-full px-8 py-3 text-lg font-semibold bg-white text-blue-700 hover:bg-blue-100 shadow-lg"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-8 py-3 text-lg font-semibold border-white text-white hover:bg-white/10 shadow-lg"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Contact Us
          </Button>
                          </div>
        <div className="flex justify-center gap-8 mt-6 text-sm text-white/80">
          <span>• No Credit Card Required</span>
          <span>• 30-Day Free Trial</span>
          <span>• Cancel Anytime</span>
                </div>
              </div>
      {/* Footer */}
      <footer className="bg-[#181828] py-12 px-4 mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-lg font-bold text-blue-400 mb-2">Expensage</div>
            <div className="text-slate-400 text-sm mb-4">Take control of your financial future with our comprehensive expense tracking platform. Simple, powerful, and designed for everyone.</div>
            <div className="flex gap-2 mt-2">
              <span className="inline-block w-3 h-3 bg-slate-500 rounded-full"></span>
              <span className="inline-block w-3 h-3 bg-slate-500 rounded-full"></span>
              <span className="inline-block w-3 h-3 bg-slate-500 rounded-full"></span>
              <span className="inline-block w-3 h-3 bg-slate-500 rounded-full"></span>
            </div>
            </div>
          <div>
            <div className="font-semibold text-white mb-2">Product</div>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>Features</li>
              <li>Pricing</li>
              <li>Security</li>
              <li>Integrations</li>
            </ul>
              </div>
          <div>
            <div className="font-semibold text-white mb-2">Support</div>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>API Docs</li>
              <li>Status</li>
            </ul>
              </div>
            </div>
        <div className="mt-8 text-center text-xs text-slate-500">
          © 2025 Expensage. All rights reserved. &nbsp;|&nbsp; Privacy Policy &nbsp;|&nbsp; Terms of Service &nbsp;|&nbsp; Cookie Policy
        </div>
      </footer>
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Index;

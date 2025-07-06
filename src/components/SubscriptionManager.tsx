import { Calendar, AlertCircle, DollarSign, Plus, Pause, X, Trash2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { format, addYears } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: '1 Month' | '3 Months' | '6 Months' | '1 Year';
  nextPayment: Date;
  status: 'active';
  icon: string;
}

const popularSubscriptions = [
  { name: 'Netflix', logo: '/logos/netflix.svg' },
  { name: 'Prime Video', logo: '/logos/prime-video.svg' },
  { name: 'JioHotstar', logo: '/logos/jiohotstar.png' },
  { name: 'Sony LIV', logo: '/logos/sonyliv.jpeg' },
  { name: 'ZEE5', logo: '/logos/zee5.jpeg' },
  { name: 'YouTube Premium', logo: '/logos/youtube.svg' },
  { name: 'Apple TV+', logo: '/logos/appletv.svg' },
  { name: 'MX Player Pro', logo: '/logos/mxplayer.png' },
  { name: 'Spotify', logo: '/logos/spotify.svg' },
  { name: 'Apple Music', logo: '/logos/apple-music.svg' },
  { name: 'YouTube Music', logo: '/logos/ytmusic.svg' },
  { name: 'Gaana Plus', logo: '/logos/gaana.svg' },
  { name: 'LinkedIn Premium', logo: '/logos/linkedin.svg' },
  { name: 'Skillshare', logo: '/logos/skillshare.svg' },
  { name: 'Coursera Plus', logo: '/logos/coursera.png' },
  { name: 'Udemy Personal Plan', logo: '/logos/udemy-3.svg' },
  { name: 'Canva Pro', logo: '/logos/canva.jpeg' },
  { name: 'ChatGPT Plus', logo: '/logos/chatgpt-plus.svg' },
  { name: 'Grammarly Premium', logo: '/logos/grammarly.svg' },
  { name: 'Google One', logo: '/logos/google-one.svg' },
  { name: 'iCloud+', logo: '/logos/icloud.svg' },
  { name: 'Microsoft 365', logo: '/logos/microsoft-365.svg' },
  { name: 'Amazon Prime', logo: '/logos/amazon-prime.svg' },
  { name: 'Flipkart Plus', logo: '/logos/flipkart.png' },
  { name: 'Swiggy One', logo: '/logos/swiggy.svg' },
  { name: 'Zomato Gold', logo: '/logos/zomato.svg' },
  { name: 'Gym Membership', logo: '/logos/gym.svg' },
  { name: 'Credit card annual fees', logo: '/logos/credit-card-annual-fees.svg' },
  { name: 'Newspaper subscription', logo: '/logos/newspaper.svg' },
];

const subscriptionCancelUrls: Record<string, string> = {
  'Netflix': 'https://www.netflix.com/CancelPlan',
  'Prime Video': 'https://www.amazon.in/gp/video/settings?ref_=atv_nb_settings',
  'JioHotstar': 'https://www.hotstar.com/in/my-account/subscription',
  'Sony LIV': 'https://www.sonyliv.com/myaccount',
  'ZEE5': 'https://www.zee5.com/myaccount/subscription',
  'YouTube Premium': 'https://www.youtube.com/premium/cancel',
  'Apple TV+': 'https://support.apple.com/en-in/HT202039',
  'MX Player Pro': 'https://www.mxplayer.in/subscription',
  'Spotify': 'https://www.spotify.com/account/subscription/',
  'Apple Music': 'https://support.apple.com/en-in/HT202039',
  'YouTube Music': 'https://www.youtube.com/musicpremium/cancel',
  'Gaana Plus': 'https://gaana.com/myaccount',
  'LinkedIn Premium': 'https://www.linkedin.com/premium/cancel',
  'Skillshare': 'https://www.skillshare.com/settings/payments',
  'Coursera Plus': 'https://www.coursera.org/account-settings/subscriptions',
  'Udemy Personal Plan': 'https://www.udemy.com/user/edit-subscription/',
  'Canva Pro': 'https://www.canva.com/account/billing',
  'ChatGPT Plus': 'https://platform.openai.com/account/billing',
  'Grammarly Premium': 'https://account.grammarly.com/subscription',
  'Google One': 'https://one.google.com/u/0/storage',
  'iCloud+': 'https://support.apple.com/en-in/HT207512',
  'Microsoft 365': 'https://account.microsoft.com/services/',
  'Amazon Prime': 'https://www.amazon.in/prime',
  'Flipkart Plus': 'https://www.flipkart.com/plus',
  'Swiggy One': 'https://www.swiggy.com/my-account',
  'Zomato Gold': 'https://www.zomato.com/subscription',
};

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [todayStr, setTodayStr] = useState(new Date().toISOString().split('T')[0]);
  const [newSubscription, setNewSubscription] = useState<{
    name: string;
    amount: string;
    frequency: '1 Month' | '3 Months' | '6 Months' | '1 Year';
    nextPayment: string;
    status: 'active';
    icon: string | null;
  }>({
    name: '',
    amount: '',
    frequency: '1 Month',
    nextPayment: todayStr,
    status: 'active',
    icon: null,
  });
  const [nameSearch, setNameSearch] = useState('');
  const [namePopoverOpen, setNamePopoverOpen] = useState(false);
  const [frequencyPopoverOpen, setFrequencyPopoverOpen] = useState(false);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;
  const maxDateObj = new Date(today);
  maxDateObj.setFullYear(today.getFullYear() + 1);
  const maxyyyy = maxDateObj.getFullYear();
  const maxmm = String(maxDateObj.getMonth() + 1).padStart(2, '0');
  const maxdd = String(maxDateObj.getDate()).padStart(2, '0');
  const maxDate = `${maxyyyy}-${maxmm}-${maxdd}`;

  // Fetch subscriptions from backend
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('jwt');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch subscriptions');
        const data = await res.json();
        setSubscriptions(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching subscriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  // Reset nextPayment to today when form opens
  useEffect(() => {
    if (showAddForm) {
      setNewSubscription(prev => ({
        ...prev,
        nextPayment: todayStr
      }));
    }
  }, [showAddForm]);

  // Add subscription to backend
  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubscription.name || !newSubscription.amount || !newSubscription.frequency || !newSubscription.nextPayment) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSubscription.name,
          amount: parseFloat(newSubscription.amount),
          frequency: newSubscription.frequency,
          nextPayment: newSubscription.nextPayment,
          status: newSubscription.status,
          icon: newSubscription.icon,
        }),
      });
      if (!res.ok) throw new Error('Failed to add subscription');
      const data = await res.json();
      setSubscriptions(prev => [...prev, data]);
      setNewSubscription({ name: '', amount: '', frequency: '1 Month', nextPayment: todayStr, status: 'active', icon: null });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Error adding subscription');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = () => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        switch (sub.frequency) {
          case '1 Month': return total + sub.amount;
          case '3 Months': return total + (sub.amount / 3);
          case '6 Months': return total + (sub.amount / 6);
          case '1 Year': return total + (sub.amount / 12);
          default: return total + sub.amount;
        }
      }, 0);
  };

  const calculateYearlyTotal = () => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        switch (sub.frequency) {
          case '1 Month': return total + (sub.amount * 12);
          case '3 Months': return total + (sub.amount * 4);
          case '6 Months': return total + (sub.amount * 2);
          case '1 Year': return total + sub.amount;
          default: return total + sub.amount;
        }
      }, 0);
  };

  // Helper to ensure nextPayment is a Date
  const getNextPaymentDate = (nextPayment: Date | string) => {
    if (nextPayment instanceof Date) return nextPayment;
    if (typeof nextPayment === 'string') return new Date(nextPayment);
    return new Date();
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return subscriptions
      .filter(sub => sub.status === 'active' && getNextPaymentDate(sub.nextPayment) <= nextWeek)
      .sort((a, b) => getNextPaymentDate(a.nextPayment).getTime() - getNextPaymentDate(b.nextPayment).getTime());
  };

  const getDaysUntilPayment = (date: Date | string) => {
    const paymentDate = getNextPaymentDate(date);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingPayments = getUpcomingPayments();

  // Delete subscription handler
  const handleDeleteSubscription = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete subscription');
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error deleting subscription');
    } finally {
      setLoading(false);
    }
  };

  // Handler for cancel button
  const handleCancelSubscription = (subscriptionName: string) => {
    const url = subscriptionCancelUrls[subscriptionName];
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('No direct cancellation link available. Please visit the provider website.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
        </div>
        <Button onClick={() => setShowAddForm((prev) => !prev)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
          {showAddForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {showAddForm ? 'Close' : 'Add Subscription'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-4 glass-card">
          <CardHeader>
            <CardTitle>Add New Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subscription Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Subscription Name</label>
                  <Popover open={namePopoverOpen} onOpenChange={setNamePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full border border-white/10 rounded px-3 py-2 flex items-center gap-2 text-left bg-card/80 text-card-foreground shadow-lg"
                        onClick={() => setNamePopoverOpen(true)}
                      >
                        {newSubscription.icon && newSubscription.name ? (
                          <img src={newSubscription.icon} alt={newSubscription.name} className="h-6 w-6 rounded" />
                        ) : null}
                        <span className={newSubscription.name ? 'truncate' : 'truncate text-gray-400'}>
                          {newSubscription.name || 'Select Subscription'}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] relative z-50 max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2">
                      <Input
                        placeholder="Search Subscription"
                        value={nameSearch}
                        onChange={e => setNameSearch(e.target.value)}
                        className="mb-2"
                        autoFocus
                      />
                      <div className="max-h-60 overflow-y-auto divide-y">
                        {popularSubscriptions
                          .filter(sub => sub.name.toLowerCase().includes(nameSearch.toLowerCase()))
                          .map(sub => (
                            <button
                              key={sub.name}
                              type="button"
                              className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${newSubscription.name === sub.name ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                setNewSubscription(prev => ({ ...prev, name: sub.name, icon: sub.logo }));
                                setNamePopoverOpen(false);
                                setNameSearch('');
                              }}
                            >
                              <img src={sub.logo} alt={sub.name} className="h-6 w-6 rounded" />
                              <span className="truncate">{sub.name}</span>
                            </button>
                          ))}
                        {popularSubscriptions.filter(sub => sub.name.toLowerCase().includes(nameSearch.toLowerCase())).length === 0 && (
                          <div className="text-gray-400 text-sm px-2 py-4 text-center">No subscriptions found</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Amount</label>
                  <div className="w-full border border-white/10 rounded px-3 py-2 flex items-center gap-2 bg-card/80 text-card-foreground shadow-lg">
                    <input 
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="w-full bg-transparent outline-none border-none p-0 m-0 text-card-foreground"
                      value={newSubscription.amount}
                      onChange={e => setNewSubscription(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.]/g, '') }))}
                      required 
                      placeholder="Amount"
                    />
                  </div>
                </div>
                {/* Frequency */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Frequency</label>
                  <Popover open={frequencyPopoverOpen} onOpenChange={setFrequencyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full border border-white/10 rounded px-3 py-2 flex items-center gap-2 text-left bg-card/80 text-card-foreground shadow-lg"
                        onClick={() => setFrequencyPopoverOpen(true)}
                      >
                        <span>
                          {newSubscription.frequency || '1 Month'}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] relative z-50 max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2">
                      <div className="flex flex-col">
                        {['1 Month', '3 Months', '6 Months', '1 Year'].map(option => (
                          <button
                            key={option}
                            type="button"
                            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${newSubscription.frequency === option ? 'bg-blue-900/60 text-blue-300' : ''}`}
                            onClick={() => {
                              setNewSubscription(prev => ({ ...prev, frequency: option as any }));
                              setFrequencyPopoverOpen(false);
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Next Payment */}
                <div className="space-y-2 md:col-span-1">
                  <label className="block text-sm font-medium">Next Payment</label>
                  <div className="relative w-full">
                    <Input
                      type="date"
                      value={newSubscription.nextPayment}
                      onChange={e => setNewSubscription(prev => ({ ...prev, nextPayment: e.target.value }))}
                      required
                      min={minDate}
                      max={maxDate}
                      className="pr-10"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Subscription'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{calculateMonthlyTotal().toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Yearly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{calculateYearlyTotal().toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {subscriptions.filter(sub => sub.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {upcomingPayments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Alert */}
      {upcomingPayments.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingPayments.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-card/80 text-card-foreground rounded-lg border border-white/10 shadow-lg">
                  <div className="flex items-center gap-3">
                    {sub.icon && sub.icon.startsWith('/logos/') ? (
                      <img src={sub.icon} alt={sub.name} className="h-8 w-8 rounded" />
                    ) : (
                      <span className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded text-lg font-bold">
                        {sub.name?.[0] || '?'}
                      </span>
                    )}
                    <div>
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-sm text-gray-400">
                        ₹{sub.amount} in {getDaysUntilPayment(sub.nextPayment)} days
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Due Soon
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions
          .slice() // copy to avoid mutating state
          .sort((a, b) => getNextPaymentDate(a.nextPayment).getTime() - getNextPaymentDate(b.nextPayment).getTime())
          .map((subscription) => (
            <Card key={subscription.id} className="hover:shadow-lg transition-shadow glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {subscription.icon && subscription.icon.startsWith('/logos/') ? (
                      <>
                        <img src={subscription.icon} alt={subscription.name} className="h-8 w-8 rounded" />
                        {/* Make the title white */}
                        <span className="font-medium text-base text-white">{subscription.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="h-8 w-8 flex items-center justify-center bg-gray-100 rounded text-lg font-bold">
                          {subscription.name?.[0] || '?'}
                        </span>
                        {/* Make the title white */}
                        <span className="font-medium text-base text-white">{subscription.name}</span>
                      </>
                    )}
                  </div>
                  {/* Remove the small active container (Badge) */}
                  {/* <Badge className={getStatusColor(subscription.status)} variant="secondary">
                  {subscription.status}
                </Badge> */}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Amount</span>
                    <span className="font-semibold">
                      ₹{subscription.amount} / {subscription.frequency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Next Payment</span>
                    <span className="text-sm">
                      {(() => {
                        const d = getNextPaymentDate(subscription.nextPayment);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Days Remaining</span>
                    <span className="text-sm">
                      {getDaysUntilPayment(subscription.nextPayment)} days
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {['Gym Membership', 'Credit card annual fees', 'Newspaper subscription'].includes(subscription.name) ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => alert('Please contact the respective provider to cancel this subscription.') }>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteSubscription(subscription.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCancelSubscription(subscription.name)}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteSubscription(subscription.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default SubscriptionManager;

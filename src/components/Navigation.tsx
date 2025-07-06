import { LogOut, User as UserIcon, Bell, LayoutDashboard, Target, Calendar, Users, PieChart, MapPin, Sparkles } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NavigationProps {
  onLogout: () => void;
  onAddTransaction: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation = ({ onLogout, onAddTransaction, activeTab, setActiveTab }: NavigationProps) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; read: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  let email = '';
  const token = localStorage.getItem('jwt');
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      email = decoded.email;
    } catch (e) {}
  }

  // Example: Simulate receiving a notification when someone joins a group
  useEffect(() => {
    // Replace this with your real-time logic (WebSocket, polling, etc.)
    const handleGroupJoin = (data: { groupName: string; userName: string }) => {
      setNotifications(prev => [
        { id: Date.now().toString(), message: `${data.userName} joined your group "${data.groupName}"`, read: false },
        ...prev,
      ]);
    };

    // Example: Simulate a join after 5 seconds (remove in production)
    // setTimeout(() => handleGroupJoin({ groupName: "Roommates", userName: "John Doe" }), 5000);

    // Cleanup if needed
    return () => {};
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Card className="fixed top-0 left-0 w-full z-50 bg-[rgba(30,30,40,0.4)] border border-white/10 shadow-lg backdrop-blur-sm rounded-none">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center gap-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-4 min-w-[160px]">
            <h1
              className="text-2xl font-bold text-white cursor-pointer transition-colors hover:text-gray-400"
              style={{ fontFamily: 'Cambria, Cochin, Georgia, Times, "Times New Roman", serif' }}
              onClick={() => {
                setActiveTab('dashboard');
                setTimeout(() => {
                  const dash = document.getElementById('dashboard-top');
                  if (dash) dash.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 50);
              }}
            >
              Expensage
            </h1>
          </div>
          {/* Center: TabsList (navigation tabs) - single line */}
          <div className="flex-1 flex justify-center">
            <TabsList className="flex flex-row flex-nowrap gap-4 bg-transparent shadow-none">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('dashboard')}
                data-state={activeTab === 'dashboard' ? 'active' : undefined}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="budgets"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('budgets')}
                data-state={activeTab === 'budgets' ? 'active' : undefined}
              >
                <Target className="h-4 w-4" />
                Budgets
              </TabsTrigger>
              <TabsTrigger
                value="subscriptions"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('subscriptions')}
                data-state={activeTab === 'subscriptions' ? 'active' : undefined}
              >
                <Calendar className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('groups')}
                data-state={activeTab === 'groups' ? 'active' : undefined}
              >
                <Users className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('charts')}
                data-state={activeTab === 'charts' ? 'active' : undefined}
              >
                <PieChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('insights')}
                data-state={activeTab === 'insights' ? 'active' : undefined}
              >
                <MapPin className="h-4 w-4" />
                Location
              </TabsTrigger>
              <TabsTrigger
                value="advisor"
                className="flex items-center gap-2 transition-colors hover:bg-blue-900/40 hover:text-blue-300 data-[state=active]:bg-blue-900/70 data-[state=active]:text-blue-200 text-white rounded-md px-3 py-1"
                onClick={() => setActiveTab('advisor')}
                data-state={activeTab === 'advisor' ? 'active' : undefined}
              >
                <Sparkles className="h-4 w-4" />
                AI Advisor
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Right: Notification, Profile and Logout */}
          <div className="flex items-center gap-2 min-w-[80px] justify-end">
            {/* Notification Bell */}
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="p-4">
                  <div className="font-bold mb-2">Notifications</div>
                  {notifications.length === 0 && (
                    <div className="text-gray-400 text-sm">No notifications</div>
                  )}
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <li
                        key={n.id}
                        className={`text-sm px-2 py-1 rounded cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-transparent text-gray-400'
                            : 'bg-blue-900/40 text-white hover:bg-blue-900/60'
                        }`}
                        onClick={() => handleNotificationClick(n.id)}
                      >
                        {n.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
            {/* Profile */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-4">
                <div className="flex flex-col items-center">
                  <UserIcon className="mb-2 h-8 w-8 text-gray-700" />
                  <div className="font-medium text-center break-all">{email || "No email found"}</div>
                </div>
              </PopoverContent>
            </Popover>
            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={() => setShowLogoutModal(true)}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Logout Dialog */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to logout?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="destructive" onClick={() => { setShowLogoutModal(false); onLogout(); }}>Yes</Button>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>No</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Navigation;

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Plus, Copy, Trash2, ChevronDown, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Group {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  createdBy: string;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt?: string;
}

interface Balance {
  user: { id: string; name: string; email: string };
  net: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  createdAt: string;
  shares: { userId: string; amount: number; user?: { name: string; email: string } }[];
  date?: string;
}

const GroupExpenses = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<{ [groupId: string]: string }>({});
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState<string | null>(null);
  const [membersMap, setMembersMap] = useState<{ [groupId: string]: GroupMember[] }>({});
  const [expensesMap, setExpensesMap] = useState<{ [groupId: string]: Expense[] }>({});
  const [balancesMap, setBalancesMap] = useState<{ [groupId: string]: Balance[] }>({});
  const [showBalances, setShowBalances] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [expenseForm, setExpenseForm] = useState<{ amount: string; paidBy: string; split: 'equal' | 'custom'; customSplits: { [userId: string]: string }; date: string }>({ amount: '', paidBy: '', split: 'equal', customSplits: {}, date: new Date().toISOString().split('T')[0] });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [showInviteFor, setShowInviteFor] = useState<string | null>(null);
  const [leaveDialog, setLeaveDialog] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [deleteExpenseDialog, setDeleteExpenseDialog] = useState<{ open: boolean; expenseId: string | null; groupId: string | null }>({ open: false, expenseId: null, groupId: null });

  useEffect(() => {
    setUserId(localStorage.getItem('userId'));
    setUserName(localStorage.getItem('userName'));
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setGroups(data);
      // Fetch members and expenses for each group
      data.forEach((g: Group) => {
        fetchMembers(g.id);
        fetchExpenses(g.id);
        fetchBalances(g.id);
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMembersMap(prev => ({ ...prev, [groupId]: data }));
    } catch {}
  };

  const fetchBalances = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBalancesMap(prev => ({ ...prev, [groupId]: data }));
    } catch {}
  };

  const fetchExpenses = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setExpensesMap(prev => ({ ...prev, [groupId]: data }));
    } catch {}
  };

  const handleCreateGroup = async () => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newGroupName, description: newGroupDesc }),
      });
      if (!res.ok) throw new Error('Failed to create group');
      setShowAddForm(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGetInviteLink = async (groupId: string) => {
    setInviteLoading(groupId);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/invite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to get invite link');
      const data = await res.json();
      setInviteLinks(prev => ({ ...prev, [groupId]: data.inviteLink }));
    } catch {}
    setInviteLoading(null);
  };

  const handleCopyInvite = (groupId: string) => {
    if (inviteLinks[groupId]) {
      navigator.clipboard.writeText(inviteLinks[groupId]);
      setInviteCopied(groupId);
      setTimeout(() => setInviteCopied(null), 1500);
    }
  };

  const getMyRole = (groupId: string): 'admin' | 'member' | null => {
    const members = membersMap[groupId];
    if (!members || !userId) return null;
    const me = members.find(m => m.id === userId);
    return me?.role || null;
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove member');
      fetchMembers(groupId);
    } catch {}
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete group');
      fetchGroups();
    } catch {}
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to leave group');
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch {}
  };

  const handleOpenBalances = (groupId: string) => {
    setShowBalances({ open: true, groupId });
    setSettleError(null);
  };

  const handleOpenExpenseDialog = (groupId: string) => {
    setShowExpenseDialog({ open: true, groupId });
    setExpenseForm({ amount: '', paidBy: '', split: 'equal', customSplits: {}, date: new Date().toISOString().split('T')[0] });
    setExpenseError(null);
  };

  const handleExpenseFormChange = (field: string, value: string) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseCustomSplit = (userId: string, value: string) => {
    setExpenseForm(prev => ({ ...prev, customSplits: { ...prev.customSplits, [userId]: value } }));
  };

  const handleSettle = async (groupId: string, balance: Balance) => {
    if (!window.confirm(`Settle ₹${(-balance.net).toFixed(2)} with ${balance.user.name || balance.user.email}?`)) return;
    setSettleLoading(true);
    setSettleError(null);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: balance.user.id, amount: -balance.net, method: 'cash' }),
      });
      if (!res.ok) throw new Error('Failed to settle');
      fetchBalances(groupId);
      fetchExpenses(groupId);
      setSettleLoading(false);
    } catch (err: any) {
      setSettleError(err.message || 'Error settling');
      setSettleLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showExpenseDialog.groupId) return;
    const { amount, paidBy, split, customSplits, date } = expenseForm;
    if (!amount || !paidBy || !date) {
      setExpenseError('Amount, paid by, and date are required');
      return;
    }
    setExpenseLoading(true);
    setExpenseError(null);
    try {
      const token = localStorage.getItem('jwt');
      let splits = undefined;
      if (split === 'custom') {
        const members = membersMap[showExpenseDialog.groupId];
        splits = members.map(m => ({ userId: m.id, amount: parseFloat(customSplits[m.id] || '0') }));
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${showExpenseDialog.groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: `Expense of ₹${amount}`,
          amount: parseFloat(amount),
          category: 'General',
          paidBy,
          date,
          splits,
        }),
      });
      if (!res.ok) throw new Error('Failed to add expense');
      setShowExpenseDialog({ open: false, groupId: null });
      fetchExpenses(showExpenseDialog.groupId);
    } catch (err: any) {
      setExpenseError(err.message || 'Error adding expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleDeleteExpense = async (groupId: string, expenseId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete expense');
      fetchExpenses(groupId);
    } catch {}
  };

  const handleDeleteExpenseButtonClick = (expenseId: string, groupId: string) => {
    setDeleteExpenseDialog({ open: true, expenseId, groupId });
  };

  const handleConfirmDeleteExpense = async () => {
    if (deleteExpenseDialog.expenseId && deleteExpenseDialog.groupId) {
      await handleDeleteExpense(deleteExpenseDialog.groupId, deleteExpenseDialog.expenseId);
      setDeleteExpenseDialog({ open: false, expenseId: null, groupId: null });
    }
  };

  const handleCancelDeleteExpense = () => {
    setDeleteExpenseDialog({ open: false, expenseId: null, groupId: null });
  };

  const handleDeleteButtonClick = (groupId: string) => {
    setDeleteDialog({ open: true, groupId });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.groupId) {
      await handleDeleteGroup(deleteDialog.groupId);
      setDeleteDialog({ open: false, groupId: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, groupId: null });
  };

  const handleLeaveButtonClick = (groupId: string) => {
    setLeaveDialog({ open: true, groupId });
  };

  const handleConfirmLeave = async () => {
    if (leaveDialog.groupId) {
      await handleLeaveGroup(leaveDialog.groupId);
      setLeaveDialog({ open: false, groupId: null });
    }
  };

  const handleCancelLeave = () => {
    setLeaveDialog({ open: false, groupId: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-white">Groups</h2>
        </div>
        <Button
          onClick={() => { setShowAddForm((prev) => !prev); setCreateError(null); }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddForm ? 'Close' : 'Add Group'}
        </Button>
      </div>
      {showAddForm && (
        <Card className="glass-card mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Add New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium mb-1">Group Name</label>
                <Input
                  id="group-name"
                  name="group-name"
                  type="text"
                  placeholder="Group name (e.g. Roommates, Goa Trip)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              {createError && <div className="text-red-600 text-xs">{createError}</div>}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 flex-row items-center">
            <Button
              type="button"
              disabled={!newGroupName || createLoading}
              onClick={handleCreateGroup}
            >
              {createLoading ? 'Adding...' : 'Add Group'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={createLoading}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {groups.map(group => {
          const myRole = getMyRole(group.id);
          const members = membersMap[group.id] || [];
          const isAdmin = myRole === 'admin';
          const isMember = myRole === 'admin' || myRole === 'member';
          return (
            <Card key={group.id} className="glass-card p-4 flex flex-col gap-1 border-blue-200 shadow relative">
              <div className="font-bold text-lg flex items-center gap-2 mb-0 text-white">
                <DollarSign className="h-5 w-5 text-green-600" /> {group.title}
              </div>
              <div className="text-sm text-gray-300 mb-0">{group.description}</div>
              <div className="flex flex-wrap gap-2 mb-0">
                {members.length > 0 ? (
                  members.map(m => (
                    <span key={m.id} className={`rounded px-2 py-0.5 text-xs font-medium ${m.role === 'admin' ? 'bg-yellow-900/60 text-yellow-200' : 'bg-blue-900/40 text-blue-200'}`}>
                      {m.name || m.email} {m.role === 'admin' && '(admin)'}
                      {isAdmin && m.role !== 'admin' && (
                        <Button size="icon" variant="ghost" className="ml-1 p-0.5" title="Remove member" onClick={() => handleRemoveMember(group.id, m.id)}><X className="h-3 w-3" /></Button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No members yet</span>
                )}
              </div>
              {/* Expenses */}
              <div className="mt-4">
                <div className="font-semibold mb-1 text-sm text-gray-500">Recent Expenses</div>
                <ul className="space-y-2">
                  {(expensesMap[group.id] || []).slice(0, 5).map(exp => (
                    <li key={exp.id} className="bg-gray-800 rounded p-2 flex flex-col gap-1 border border-gray-700 text-white">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{exp.description}</span>
                        <span className="text-blue-400 font-bold ml-auto">₹{exp.amount.toFixed(2)}</span>
                        {(exp.date || exp.createdAt) && (
                          <span className="ml-2 text-xs text-gray-400">
                            {(() => {
                              const d = new Date(exp.date || exp.createdAt);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            })()}
                          </span>
                        )}
                        {exp.paidBy === userId && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteExpenseButtonClick(exp.id, group.id)}
                            title="Delete expense"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-gray-300 flex gap-2">
                        <span>Paid by: {exp.shares && exp.shares.length > 0 && exp.shares.find(s => s.userId === exp.paidBy)?.user?.name || exp.paidBy}</span>
                        <span>| Split: {exp.shares && exp.shares.length > 0 ? exp.shares.map(s => `${s.user?.name || s.userId}: ₹${s.amount.toFixed(2)}`).join(', ') : 'Equal'}</span>
                      </div>
                    </li>
                  ))}
                  {(expensesMap[group.id] || []).length === 0 && <li className="text-xs text-gray-200">No expenses yet</li>}
                </ul>
              </div>
              {/* Action Buttons at Bottom */}
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => {
                  handleGetInviteLink(group.id);
                  setShowInviteFor(group.id);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Members
                </Button>
                <Button size="sm" className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white" onClick={() => handleOpenExpenseDialog(group.id)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Expense
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleLeaveButtonClick(group.id)} title="Leave Group">
                  <X className="h-4 w-4 mr-1" /> Leave
                </Button>
              </div>
              {/* Invite link, only for the group whose Add Members was clicked */}
              {showInviteFor === group.id && (
                inviteLoading === group.id ? (
                  <div className="text-xs text-gray-300 mt-2">Loading invite link...</div>
                ) : inviteLinks[group.id] ? (
                  <div className="w-full mt-2 flex items-center gap-2">
                    <Input value={inviteLinks[group.id]} readOnly className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={() => handleCopyInvite(group.id)}><Copy className="h-4 w-4" /></Button>
                    {inviteCopied === group.id && <span className="text-green-600 text-xs ml-1">Copied!</span>}
                  </div>
                ) : null
              )}
            </Card>
          );
        })}
      </div>
      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog.open} onOpenChange={open => setShowExpenseDialog({ open, groupId: open ? showExpenseDialog.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group Expense</DialogTitle>
          </DialogHeader>
          {showExpenseDialog.groupId && (
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" min="0" value={expenseForm.amount} onChange={e => handleExpenseFormChange('amount', e.target.value)} required className="no-spinner" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => handleExpenseFormChange('date', e.target.value)}
                  required
                  className="pr-10"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paid By</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="w-full border border-white/10 rounded px-3 py-2 flex items-center gap-2 text-left bg-card/80 text-card-foreground shadow-lg">
                      <span className={expenseForm.paidBy ? 'truncate' : 'truncate text-gray-400'}>
                        {expenseForm.paidBy ? (membersMap[showExpenseDialog.groupId]?.find(m => m.id === expenseForm.paidBy)?.name || 'Unknown') : 'Select who paid'}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] relative z-50 max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2">
                    <div className="flex flex-col">
                      {(membersMap[showExpenseDialog.groupId] || []).map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${expenseForm.paidBy === m.id ? 'bg-blue-900/60 text-blue-300' : ''}`}
                          onClick={() => handleExpenseFormChange('paidBy', m.id)}
                        >
                          {m.name || m.email}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Split Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="splitMethod" value="equal" checked={expenseForm.split === 'equal'} onChange={() => handleExpenseFormChange('split', 'equal')} /> Equal
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="splitMethod" value="custom" checked={expenseForm.split === 'custom'} onChange={() => handleExpenseFormChange('split', 'custom')} /> Custom
                  </label>
                </div>
              </div>
              {expenseForm.split === 'custom' && (
                <div className="space-y-2">
                  {(membersMap[showExpenseDialog.groupId] || []).map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="w-32">{m.name || m.email}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.customSplits[m.id] || ''}
                        onChange={e => handleExpenseCustomSplit(m.id, e.target.value)}
                        placeholder="Amount"
                        required
                        className="no-spinner"
                      />
                    </div>
                  ))}
                </div>
              )}
              {expenseError && <div className="text-red-600 text-xs">{expenseError}</div>}
              <DialogFooter>
                <Button type="submit" disabled={expenseLoading}>{expenseLoading ? 'Adding...' : 'Add Expense'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowExpenseDialog({ open: false, groupId: null })} disabled={expenseLoading}>Cancel</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Balances Dialog */}
      <Dialog open={showBalances.open} onOpenChange={open => setShowBalances({ open, groupId: open ? showBalances.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Balances</DialogTitle>
          </DialogHeader>
          {showBalances.groupId && (
            <div className="space-y-4">
              {(balancesMap[showBalances.groupId] || []).map(b => (
                <div key={b.user.id} className="flex items-center justify-between border-b border-gray-700 pb-2 text-sm">
                  <span>{b.user.name || b.user.email}</span>
                  <span className={b.net < 0 ? 'text-red-500' : 'text-green-400'}>
                    {b.net < 0 ? `Owes ₹${(-b.net).toFixed(2)}` : `Gets ₹${b.net.toFixed(2)}`}
                  </span>
                  {b.net < 0 && b.user.id === userId && (
                    <Button size="sm" disabled={settleLoading} onClick={() => handleSettle(showBalances.groupId!, b)}>
                      Settle Up
                    </Button>
                  )}
                </div>
              ))}
              {settleError && <div className="text-red-600 text-xs">{settleError}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open, groupId: open ? deleteDialog.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this group?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
            <Button variant="outline" onClick={handleCancelDelete}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Group Confirmation Dialog */}
      <Dialog open={leaveDialog.open} onOpenChange={open => setLeaveDialog({ open, groupId: open ? leaveDialog.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to leave this group?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmLeave}>Leave</Button>
            <Button variant="outline" onClick={handleCancelLeave}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Dialog */}
      <Dialog open={deleteExpenseDialog.open} onOpenChange={open => setDeleteExpenseDialog({ open, expenseId: open ? deleteExpenseDialog.expenseId : null, groupId: open ? deleteExpenseDialog.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this expense?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmDeleteExpense}>Delete</Button>
            <Button variant="outline" onClick={handleCancelDeleteExpense}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupExpenses;


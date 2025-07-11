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

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: string;
  createdAt: string;
  shares: { userId: string; amount: number; user?: { name: string; email: string } }[];
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
  const [showExpenseDialog, setShowExpenseDialog] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [expenseForm, setExpenseForm] = useState<{ title: string; amount: string; category: string; date: string; paidBy: string; split: 'equal' | 'custom'; customSplits: { [userId: string]: string } }>({ title: '', amount: '', category: '', date: '', paidBy: '', split: 'equal', customSplits: {} });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);

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
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
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

  const handleOpenExpenseDialog = (groupId: string) => {
    setShowExpenseDialog({ open: true, groupId });
    setExpenseForm({ title: '', amount: '', category: '', date: '', paidBy: '', split: 'equal', customSplits: {} });
    setExpenseError(null);
  };

  const handleExpenseFormChange = (field: string, value: string) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseCustomSplit = (userId: string, value: string) => {
    setExpenseForm(prev => ({ ...prev, customSplits: { ...prev.customSplits, [userId]: value } }));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showExpenseDialog.groupId) return;
    const { title, amount, category, date, paidBy, split, customSplits } = expenseForm;
    if (!title || !amount || !category || !date || !paidBy) {
      setExpenseError('All fields are required');
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
          description: title,
          amount: parseFloat(amount),
          category,
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
              <div>
                <label htmlFor="group-desc" className="block text-sm font-medium mb-1">Description</label>
                <Input
                  id="group-desc"
                  name="group-desc"
                  type="text"
                  placeholder="Group description"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  required
                />
              </div>
              {createError && <div className="text-red-600 text-xs">{createError}</div>}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 flex-col items-start">
            <Button
              type="button"
              disabled={!newGroupName || !newGroupDesc || createLoading}
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
            <Card key={group.id} className="glass-card p-6 flex flex-col gap-4 border-blue-200 shadow relative">
              <div className="font-bold text-lg flex items-center gap-2 mb-2 text-white">
                <DollarSign className="h-5 w-5 text-green-600" /> {group.title}
              </div>
              <div className="text-sm text-gray-300 mb-2">{group.description}</div>
              <div className="flex flex-wrap gap-2 mb-2">
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Created At</span>
                <span className="text-sm">{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {isAdmin && (
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => handleGetInviteLink(group.id)}>
                    <Plus className="h-4 w-4 mr-2" /> Invite Members
                  </Button>
                )}
                {isMember && (
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white" onClick={() => handleOpenExpenseDialog(group.id)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Expense
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteGroup(group.id)} title="Delete Group">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                )}
              </div>
              {/* Invite link */}
              {inviteLoading === group.id ? (
                <div className="text-xs text-gray-300 mt-2">Loading invite link...</div>
              ) : inviteLinks[group.id] ? (
                <div className="w-full mt-2 flex items-center gap-2">
                  <Input value={inviteLinks[group.id]} readOnly className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={() => handleCopyInvite(group.id)}><Copy className="h-4 w-4" /></Button>
                  {inviteCopied === group.id && <span className="text-green-600 text-xs ml-1">Copied!</span>}
                </div>
              ) : null}
              {/* Expenses */}
              <div className="mt-4">
                <div className="font-semibold mb-1 text-sm text-gray-500">Recent Expenses</div>
                <ul className="space-y-2">
                  {(expensesMap[group.id] || []).slice(0, 5).map(exp => (
                    <li key={exp.id} className="bg-gray-800 rounded p-2 flex flex-col gap-1 border border-gray-700 text-white">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{exp.description}</span>
                        <span className="text-blue-400 font-bold ml-auto">₹{exp.amount.toFixed(2)}</span>
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
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input type="text" value={expenseForm.title} onChange={e => handleExpenseFormChange('title', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={e => handleExpenseFormChange('amount', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input type="text" value={expenseForm.category} onChange={e => handleExpenseFormChange('category', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input type="date" value={expenseForm.date} onChange={e => handleExpenseFormChange('date', e.target.value)} required />
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
    </div>
  );
};

export default GroupExpenses;

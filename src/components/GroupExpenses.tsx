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
  createdAt?: string;
}

interface Balance {
  user: { id: string; name: string; email: string };
  net: number;
}

const GroupExpenses = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<{ [groupId: string]: Balance[] }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberList, setMemberList] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [inviteLinkForGroup, setInviteLinkForGroup] = useState<string | null>(null);
  const [inviteCopiedForGroup, setInviteCopiedForGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalGroupName, setInviteModalGroupName] = useState('');
  const [inviteModalLink, setInviteModalLink] = useState('');
  const [showDummyInvite, setShowDummyInvite] = useState(false);
  const [activeInviteGroupId, setActiveInviteGroupId] = useState<string | null>(null);
  const [groupInviteLinks, setGroupInviteLinks] = useState<{ [groupId: string]: string }>({});
  const [groupInviteLoading, setGroupInviteLoading] = useState<string | null>(null);
  const [groupInviteCopied, setGroupInviteCopied] = useState<string | null>(null);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState<{ open: boolean; groupId: string | null }>({ open: false, groupId: null });
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [userId: string]: string }>({});
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<{ [groupId: string]: any[] }>({});
  const [groupMembersMap, setGroupMembersMap] = useState<{ [groupId: string]: { id: string; name: string; email: string }[] }>({});

  useEffect(() => {
    // Get userId from localStorage (assume it's set after login)
    setUserId(localStorage.getItem('userId'));
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
        let data = await res.json();
        // Sort groups by createdAt descending so latest is at the top
        data = data.sort((a, b) => (b.createdAt && a.createdAt ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0));
        setGroups(data);
        // Fetch balances for each group
        data.forEach((group: Group) => fetchBalances(group.id));
      } catch (err: any) {
        setError(err.message || 'Error fetching groups');
      } finally {
        setLoading(false);
      }
    };

  const fetchBalances = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch balances');
      const data = await res.json();
      setBalances(prev => ({ ...prev, [groupId]: data }));
    } catch (err) {
      // ignore error for individual group
    }
  };

  const handleAddMemberEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberEmail && !memberList.includes(memberEmail)) {
      setMemberList(prev => [...prev, memberEmail]);
      setMemberEmail('');
    }
  };

  const handleCreateGroupAndInvite = async () => {
    setCreateLoading(true);
    setCreateError(null);
    setInviteLink(null);
    try {
      const token = localStorage.getItem('jwt');
      // Create group
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newGroupName }),
      });
      if (!res.ok) throw new Error('Failed to create group');
      const group = await res.json();
      // Fetch invite link
      const inviteRes = await fetch(`${import.meta.env.VITE_API_URL}/groups/${group.id}/invite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let link = '';
      if (inviteRes.ok) {
        const data = await inviteRes.json();
        link = data.inviteLink;
      }
      setInviteModalGroupName(group.title);
      setInviteModalLink(link);
      setShowInviteModal(true);
      fetchGroups();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1500);
    }
  };

  const handleOpenAddMembers = async (groupId: string) => {
    setShowAddMembersModal({ open: true, groupId });
    setInviteLinkForGroup(null);
    setInviteCopiedForGroup(false);
    // Fetch invite link
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/invite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInviteLinkForGroup(data.inviteLink);
      }
    } catch {}
  };

  const handleCopyInviteForGroup = () => {
    if (inviteLinkForGroup) {
      navigator.clipboard.writeText(inviteLinkForGroup);
      setInviteCopiedForGroup(true);
      setTimeout(() => setInviteCopiedForGroup(false), 1500);
    }
  };

  const handleShowGroupInvite = async (groupId: string) => {
    setActiveInviteGroupId(groupId);
    if (!groupInviteLinks[groupId]) {
      setGroupInviteLoading(groupId);
      try {
        const token = localStorage.getItem('jwt');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/invite`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setGroupInviteLinks(prev => ({ ...prev, [groupId]: data.inviteLink }));
        }
      } finally {
        setGroupInviteLoading(null);
      }
    }
  };

  const handleOpenAddExpense = async (groupId: string) => {
    setShowAddExpenseForm({ open: true, groupId });
    setExpenseAmount('');
    setExpensePaidBy('');
    setSplitMethod('equal');
    setCustomSplits({});
    setExpenseError(null);
    setExpenseLoading(false);
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch group members');
      const data = await res.json();
      setGroupMembers(data);
      if (data.length > 0) setExpensePaidBy(data[0].id);
    } catch {
      setGroupMembers([]);
    }
  };

  const fetchGroupExpenses = async (groupId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch group expenses');
      const data = await res.json();
      setGroupExpenses(prev => ({ ...prev, [groupId]: data }));
    } catch {}
  };

  useEffect(() => {
    groups.forEach(group => fetchGroupExpenses(group.id));
  }, [groups.length]);

  // Fetch group members for all groups after fetching groups
  useEffect(() => {
    if (groups.length > 0) {
      const token = localStorage.getItem('jwt');
      groups.forEach(group => {
        fetch(`${import.meta.env.VITE_API_URL}/groups/${group.id}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            setGroupMembersMap(prev => ({ ...prev, [group.id]: data }));
          });
      });
    }
  }, [groups]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-white">Groups</h2>
        </div>
        <Button
          onClick={() => { setShowAddForm((prev) => !prev); setInviteLink(null); setNewGroupName(''); setCreateError(null); }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {showAddForm ? (
            <X className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
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
                <label className="block text-sm font-medium mb-1">Group Name</label>
                <Input
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
          <CardFooter className="flex gap-2 flex-col items-start">
            <div className="flex gap-2 flex-col w-full">
              <div className="flex gap-2">
                {/* Existing Add Group and Cancel buttons */}
                <Button
                  type="button"
                  disabled={!newGroupName || createLoading}
                  onClick={async () => {
                    setCreateLoading(true);
                    setCreateError(null);
                    try {
                      const token = localStorage.getItem('jwt');
                      // Create group
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ title: newGroupName }),
                      });
                      if (!res.ok) throw new Error('Failed to create group');
                      fetchGroups();
                      setShowAddForm(false); // Close the form after group creation
                      setNewGroupName('');
                    } catch (err: any) {
                      setCreateError(err.message || 'Error creating group');
                    } finally {
                      setCreateLoading(false);
                    }
                  }}
                >
                  {createLoading ? 'Adding...' : 'Add Group'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} disabled={createLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {groups.map(group => (
          <Card key={group.id} className="glass-card p-6 flex flex-col gap-4 border-blue-200 shadow relative">
            <div className="font-bold text-lg flex items-center gap-2 mb-2 text-white">
              <DollarSign className="h-5 w-5 text-green-600" /> {group.title}
            </div>
            {/* Members row */}
            <div className="flex flex-wrap gap-2 mb-2">
              {groupMembersMap[group.id]?.length > 0 ? (
                groupMembersMap[group.id].map(m => (
                  <span key={m.id} className="bg-blue-900/40 text-blue-200 rounded px-2 py-0.5 text-xs font-medium">
                    {m.name || m.email}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No members yet</span>
              )}
            </div>
            {/* Created At row, styled like SubscriptionManager's Next Payment */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Created At</span>
              <span className="text-sm">
                {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </div>
            <div className="mt-4">
              <div className="font-semibold mb-1 text-sm text-gray-500">Recent Expenses</div>
              <ul className="space-y-2">
                {(groupExpenses[group.id] || []).slice(0, 5).map(exp => (
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
                {(groupExpenses[group.id] || []).length === 0 && <li className="text-xs text-gray-200">No expenses yet</li>}
              </ul>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => handleShowGroupInvite(group.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white" onClick={() => handleOpenAddExpense(group.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={async () => {
                try {
                  const token = localStorage.getItem('jwt');
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${group.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error('Failed to delete group');
                  fetchGroups();
                } catch (err) {
                  // Optionally show error toast
                }
              }} title="Delete Group">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            {/* Inline invite link for this group */}
            {activeInviteGroupId === group.id && (
              <div className="w-full mt-2 flex items-center gap-2">
                {groupInviteLoading === group.id ? (
                  <span className="text-xs text-gray-300">Loading invite link...</span>
                ) : groupInviteLinks[group.id] ? (
                  <>
                    <span className="text-xs text-gray-300 break-all">{groupInviteLinks[group.id]}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(groupInviteLinks[group.id]);
                      setGroupInviteCopied(group.id);
                      setTimeout(() => setGroupInviteCopied(null), 1500);
                    }}><Copy className="h-4 w-4" /></Button>
                    {groupInviteCopied === group.id && <span className="text-green-600 text-xs ml-1">Copied!</span>}
                  </>
                ) : null}
              </div>
            )}
          </Card>
        ))}
      </div>
      {/* Add Members Modal */}
      <Dialog open={showAddMembersModal.open} onOpenChange={open => setShowAddMembersModal({ open, groupId: open ? showAddMembersModal.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members to Group</DialogTitle>
          </DialogHeader>
          {showAddMembersModal.groupId && (
            <div className="space-y-4">
              <div className="font-bold text-lg">{groups.find(g => g.id === showAddMembersModal.groupId)?.title}</div>
              {/* Styled container for invite link and copy button */}
              <div className="bg-gray-50 rounded-lg p-4 border flex flex-col gap-2">
                {inviteLinkForGroup ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input value={inviteLinkForGroup} readOnly className="flex-1" />
                      <Button type="button" variant="outline" onClick={handleCopyInviteForGroup}><Copy className="h-4 w-4" /></Button>
                      {inviteCopiedForGroup && <span className="text-green-600 text-xs ml-1">Copied!</span>}
                    </div>
                    <div className="text-xs text-gray-300">Share this link with others to let them join your group.</div>
                  </>
                ) : (
                  <div className="text-gray-300">Generating invite link...</div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" className="w-full" onClick={() => setShowAddMembersModal({ open: false, groupId: null })}>Add Group</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Dialog for add expense form */}
      <Dialog open={showAddExpenseForm.open} onOpenChange={open => setShowAddExpenseForm({ open, groupId: open ? showAddExpenseForm.groupId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group Expense</DialogTitle>
          </DialogHeader>
                      <form
              onSubmit={async e => {
                e.preventDefault();
                if (!expenseAmount || !expensePaidBy) {
                  setExpenseError('Please fill in all required fields');
                  return;
                }
                if (!showAddExpenseForm.groupId) {
                  setExpenseError('Please create a group first before adding expenses');
                  return;
                }
                setExpenseLoading(true);
                setExpenseError(null);
                try {
                  const token = localStorage.getItem('jwt');
                  const splits = splitMethod === 'equal'
                    ? undefined
                    : groupMembers.map(m => ({ userId: m.id, amount: parseFloat(customSplits[m.id] || '0') }));
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${showAddExpenseForm.groupId}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      amount: parseFloat(expenseAmount),
                      paidBy: expensePaidBy,
                      description: 'Group expense',
                      category: 'General',
                      splits,
                    }),
                  });
                  if (!res.ok) throw new Error('Failed to add expense');
                  setShowAddExpenseForm({ open: false, groupId: null });
                  fetchGroups();
                  fetchGroupExpenses(showAddExpenseForm.groupId);
                } catch (err: any) {
                  setExpenseError(err.message || 'Error adding expense');
                } finally {
                  setExpenseLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Total Amount</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  required
                />
              </div>
                              <div>
                  <label className="block text-sm font-medium mb-1">Paid By</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full border border-white/10 rounded px-3 py-2 flex items-center gap-2 text-left bg-card/80 text-card-foreground shadow-lg"
                      >
                        <span className={expensePaidBy ? 'truncate' : 'truncate text-gray-400'}>
                          {expensePaidBy ? groupMembers.find(m => m.id === expensePaidBy)?.name || groupMembers.find(m => m.id === expensePaidBy)?.email || 'Unknown' : 'Select who paid'}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] relative z-50 max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-2">
                      <div className="flex flex-col">
                        {groupMembers.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${expensePaidBy === m.id ? 'bg-blue-900/60 text-blue-300' : ''}`}
                            onClick={() => setExpensePaidBy(m.id)}
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
                    <input
                      type="radio"
                      name="splitMethod"
                      value="equal"
                      checked={splitMethod === 'equal'}
                      onChange={() => setSplitMethod('equal')}
                    />
                    Equal (default)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="splitMethod"
                      value="custom"
                      checked={splitMethod === 'custom'}
                      onChange={() => setSplitMethod('custom')}
                    />
                    Custom (manual split per person)
                  </label>
                </div>
              </div>
              {splitMethod === 'custom' && (
                <div className="space-y-2">
                  {groupMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="w-32">{m.name || m.email}</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={customSplits[m.id] || ''}
                        onChange={e => {
                          // Only allow numbers and a single decimal point
                          let val = e.target.value.replace(/[^0-9.]/g, '');
                          // Prevent more than one decimal point
                          if ((val.match(/\./g) || []).length > 1) {
                            val = val.substring(0, val.length - 1);
                          }
                          setCustomSplits(prev => ({ ...prev, [m.id]: val }));
                        }}
                        placeholder="Amount"
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              {expenseError && <div className="text-red-600 text-xs">{expenseError}</div>}
              <DialogFooter>
                <Button type="submit" disabled={expenseLoading}>
                  {expenseLoading ? 'Adding...' : 'Add Expense'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddExpenseForm({ open: false, groupId: null })} disabled={expenseLoading}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupExpenses;

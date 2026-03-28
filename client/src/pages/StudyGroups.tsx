/**
 * Collaborative Study Groups
 * Create/join groups, share quizzes, run challenges, compare progress.
 */

import Navigation from '@/components/Navigation';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Users, Plus, LogIn, Copy, Check, Crown, Trophy,
  Swords, BookOpen, Clock, ArrowRight, Globe, Lock,
  Trash2, UserMinus, Share2, Sparkles, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';

type View = 'list' | 'detail' | 'create';

export default function StudyGroups() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublic, setNewPublic] = useState(true);

  // Queries
  const myGroups = trpc.groups.myGroups.useQuery(undefined, { enabled: isAuthenticated });
  const publicGroups = trpc.groups.discover.useQuery(undefined, { enabled: isAuthenticated });
  const groupDetail = trpc.groups.getById.useQuery(
    { groupId: selectedGroupId! },
    { enabled: !!selectedGroupId && isAuthenticated }
  );

  // Mutations
  const utils = trpc.useUtils();
  const createGroup = trpc.groups.create.useMutation({
    onSuccess: (data) => {
      toast.success('Group created!');
      utils.groups.myGroups.invalidate();
      setSelectedGroupId(data.groupId);
      setView('detail');
      setNewName('');
      setNewDesc('');
    },
    onError: (e) => toast.error(e.message),
  });

  const joinGroup = trpc.groups.join.useMutation({
    onSuccess: (data) => {
      toast.success(`Joined "${data.name}"!`);
      utils.groups.myGroups.invalidate();
      setSelectedGroupId(data.groupId);
      setView('detail');
      setJoinCode('');
    },
    onError: (e) => toast.error(e.message),
  });

  const leaveGroup = trpc.groups.leave.useMutation({
    onSuccess: () => {
      toast.success('Left group');
      utils.groups.myGroups.invalidate();
      setView('list');
      setSelectedGroupId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteGroupMut = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success('Group deleted');
      utils.groups.myGroups.invalidate();
      setView('list');
      setSelectedGroupId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Study Groups</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to create or join collaborative study groups, share quizzes, and compete with peers.</p>
            <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              <LogIn className="w-4 h-4" /> Sign In to Continue
            </a>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="min-h-screen px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Study Groups
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">Collaborate, share quizzes, and challenge your peers.</p>
            </div>
            {view !== 'create' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setView('create')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" /> Create Group
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── List View ── */}
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Join by Code */}
              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Join by Invite Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter invite code..."
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => joinCode.trim() && joinGroup.mutate({ inviteCode: joinCode.trim() })}
                    disabled={!joinCode.trim() || joinGroup.isPending}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {joinGroup.isPending ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>

              {/* My Groups */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>My Groups</h2>
                {myGroups.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : !myGroups.data?.length ? (
                  <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">You haven't joined any groups yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Create one or join with an invite code above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroups.data.map((group, i) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => { setSelectedGroupId(group.id); setView('detail'); }}
                        className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {group.isPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                            {group.memberRole === 'owner' && <Crown className="w-4 h-4 text-amber-500" />}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{group.memberRole}</span>
                        </div>
                        <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Discover Public Groups */}
              <section>
                <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Discover Groups</h2>
                {publicGroups.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : !publicGroups.data?.length ? (
                  <div className="text-center py-8 bg-card border border-border rounded-xl">
                    <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No public groups yet. Be the first to create one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicGroups.data.map((group, i) => {
                      const isMember = myGroups.data?.some(g => g.id === group.id);
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-card border border-border rounded-xl p-5"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[10px] font-mono text-muted-foreground">Public</span>
                          </div>
                          <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{group.name}</h3>
                          {group.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{group.description}</p>}
                          {isMember ? (
                            <button
                              onClick={() => { setSelectedGroupId(group.id); setView('detail'); }}
                              className="text-xs text-primary font-medium flex items-center gap-1"
                            >
                              View Group <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => joinGroup.mutate({ inviteCode: group.inviteCode })}
                              disabled={joinGroup.isPending}
                              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                            >
                              Join
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* ── Create View ── */}
          {view === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Create Study Group</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Group Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Finance Study Circle"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What's this group about?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewPublic(!newPublic)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        newPublic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      }`}
                    >
                      <Globe className="w-4 h-4" /> Public
                    </button>
                    <button
                      onClick={() => setNewPublic(!newPublic)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        !newPublic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      }`}
                    >
                      <Lock className="w-4 h-4" /> Private
                    </button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setView('list')}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => newName.trim() && createGroup.mutate({ name: newName.trim(), description: newDesc.trim() || undefined, isPublic: newPublic })}
                      disabled={!newName.trim() || createGroup.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {createGroup.isPending ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Detail View ── */}
          {view === 'detail' && selectedGroupId && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => { setView('list'); setSelectedGroupId(null); }}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
              >
                ← Back to Groups
              </button>

              {groupDetail.isLoading ? (
                <div className="space-y-4">
                  <div className="h-24 bg-card border border-border rounded-xl animate-pulse" />
                  <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
                </div>
              ) : groupDetail.data ? (
                <div className="space-y-6">
                  {/* Group Header */}
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                          {groupDetail.data.group.name}
                        </h2>
                        {groupDetail.data.group.description && (
                          <p className="text-sm text-muted-foreground mt-1">{groupDetail.data.group.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {groupDetail.data.group.isPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => copyInviteCode(groupDetail.data!.group.inviteCode)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs hover:border-primary/30 transition-colors"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        <span className="font-mono">{groupDetail.data.group.inviteCode}</span>
                      </button>
                      {groupDetail.data.group.ownerId === user?.id && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this group? This cannot be undone.')) {
                              deleteGroupMut.mutate({ groupId: selectedGroupId });
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                      {groupDetail.data.group.ownerId !== user?.id && (
                        <button
                          onClick={() => leaveGroup.mutate({ groupId: selectedGroupId })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <UserMinus className="w-3 h-3" /> Leave
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Members */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <Users className="w-4 h-4 text-primary" />
                      Members ({groupDetail.data.members.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupDetail.data.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {(member.user.name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.user.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{member.role}</p>
                          </div>
                          {member.role === 'owner' && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared Quizzes */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                        <BookOpen className="w-4 h-4 text-primary" />
                        Shared Quizzes ({groupDetail.data.quizzes.length})
                      </h3>
                      <button
                        onClick={() => navigate('/ai-quiz')}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Sparkles className="w-3 h-3" /> Generate Quiz
                      </button>
                    </div>
                    {groupDetail.data.quizzes.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No shared quizzes yet. Generate one with AI Quiz and share it here!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupDetail.data.quizzes.map(quiz => (
                          <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">{quiz.title}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {quiz.discipline} · {quiz.difficulty} · {Array.isArray(quiz.questionIds) ? (quiz.questionIds as number[]).length : 0} Qs
                                {quiz.timeLimit ? ` · ${Math.round(quiz.timeLimit / 60)}min` : ''}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                                Take Quiz
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Challenges */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <Swords className="w-4 h-4 text-primary" />
                      Challenges ({groupDetail.data.challenges.length})
                    </h3>
                    {groupDetail.data.challenges.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No challenges yet. Share a quiz first, then create a challenge!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupDetail.data.challenges.map(challenge => (
                          <div key={challenge.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">Challenge #{challenge.id}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                Status: {challenge.status}
                                {challenge.endsAt ? ` · Ends: ${new Date(challenge.endsAt).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                              challenge.status === 'open' ? 'bg-green-500/20 text-green-400' :
                              challenge.status === 'active' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {challenge.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Group not found.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Navigation>
  );
}

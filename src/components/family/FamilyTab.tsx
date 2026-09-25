import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Calendar, 
  Zap, 
  Check, 
  X,
  Sparkles,
  Crown,
  UserPlus
} from 'lucide-react';
import { Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { UserManagementModal } from '../admin/UserManagementModal';

export const FamilyTab: React.FC = () => {
  const { users, tasks, addTask, completeTask, currentUser, settings, assets } = useAppStore();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'completed'>('todo');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignedToId, setAssignedToId] = useState(users[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetId, setAssetId] = useState('');
  const [xpReward, setXpReward] = useState(35);
  const [earnedXPAlert, setEarnedXPAlert] = useState('');

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const canAssignTask = currentUser.role === 'admin' || currentUser.role === 'manager';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: desc.trim(),
      assignedToId,
      dueDate,
      status: 'todo',
      assetId: assetId || undefined,
      xpReward: Number(xpReward)
    });

    setTitle('');
    setDesc('');
    setShowAddTaskModal(false);
  };

  const handleComplete = (task: Task) => {
    completeTask(task.id);
    setEarnedXPAlert(`Tuyệt vời! Đã hoàn thành nhiệm vụ và nhận +${task.xpReward} XP!`);
    setTimeout(() => setEarnedXPAlert(''), 4000);
  };

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-20">
      {/* Title & Add Task */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('family_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('family_subtitle')}
          </p>
        </div>

        {canAssignTask && (
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus size={16} />
            <span>{t('action_add')}</span>
          </button>
        )}
      </div>

      {/* Success XP alert */}
      {earnedXPAlert && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>{earnedXPAlert}</span>
        </div>
      )}

      {/* Family Members Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            {t('family_members')} ({users.length})
          </h2>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowUserManagementModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-sm"
            >
              <Crown size={12} className="text-amber-500" />
              <span>{t('family_admin_manage')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {users.map(u => (
            <div
              key={u.id}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                u.id === currentUser.id
                  ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <span className="text-2xl">{u.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{u.name}</span>
                  {u.role === 'admin' && <Crown size={11} className="text-amber-500 shrink-0" />}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <span>🏆 {u.points} XP</span>
                  <span className="opacity-40">•</span>
                  <span className="capitalize">{u.role}</span>
                </div>
              </div>
            </div>
          ))}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowUserManagementModal(true)}
              className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition group"
            >
              <UserPlus size={16} className="group-hover:scale-110 transition-transform text-indigo-500" />
              <span>{t('family_add_member_short')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('family_tasks')} ({filteredTasks.length})
          </h2>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px]">
            <button
              onClick={() => setTaskFilter('todo')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                taskFilter === 'todo'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('family_filter_todo')}
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                taskFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('family_filter_completed')}
            </button>
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                taskFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('family_filter_all')}
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            {t('family_no_tasks')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map(task => {
              const assignee = userMap[task.assignedToId];
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 opacity-75'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      <button
                        onClick={() => !isCompleted && handleComplete(task)}
                        disabled={isCompleted}
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50'
                        }`}
                      >
                        {isCompleted && <Check size={12} />}
                      </button>

                      <div className="space-y-1">
                        <div className={`text-xs font-bold text-slate-900 dark:text-white ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            {assignee?.avatar} {assignee?.name || t('family_unassigned')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        <Zap size={10} /> +{task.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl md:rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('family_add_task')}
              </h3>
              <button onClick={() => setShowAddTaskModal(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_task_name')} *</label>
                <input
                  type="text"
                  required
                  placeholder={settings.language === 'vi' ? 'VD: Thay lõi lọc nước, Vệ sinh robot...' : settings.language === 'ja' ? '例：フィルター交換、掃除ロボット清掃...' : 'e.g. Replace water filter, clean robot...'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_task_desc')}</label>
                <textarea
                  rows={2}
                  placeholder={settings.language === 'vi' ? 'Các bước thực hiện...' : settings.language === 'ja' ? '手順の詳細...' : 'Steps to follow...'}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_assignee')}</label>
                  <select
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.avatar} {u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_due_date')}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_attach_asset')}</label>
                  <select
                    value={assetId}
                    onChange={e => setAssetId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs"
                  >
                    <option value="">{t('family_no_asset')}</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('family_xp_reward')}</label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={xpReward}
                    onChange={e => setXpReward(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  {t('family_btn_assign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal (Admin) */}
      {showUserManagementModal && (
        <UserManagementModal onClose={() => setShowUserManagementModal(false)} />
      )}
    </div>
  );
};

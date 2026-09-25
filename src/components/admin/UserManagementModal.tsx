import React, { useState } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Crown, 
  Shield, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface UserManagementModalProps {
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '👦', '👧', '👶', '👵', '👴', '🧑', '👱‍♂️', '👱‍♀️', '🧔', '👩', '👨'];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { users, currentUser, addUser, updateUser, deleteUser, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);
  
  const [activeTab, setActiveTab] = useState<'members' | 'permissions'>('members');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Add user form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newAvatar, setNewAvatar] = useState('👩‍💼');

  // Edit user form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editAvatar, setEditAvatar] = useState('');

  // Status/Alert message
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleStartAdd = () => {
    setEditingUserId(null);
    setNewName('');
    setNewRole('member');
    setNewAvatar('👩‍💼');
    setIsAddingUser(true);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addUser({
      name: newName.trim(),
      role: newRole,
      avatar: newAvatar
    });

    setIsAddingUser(false);
    setNewName('');
    showAlert(`Đã thêm thành viên "${newName.trim()}" thành công!`);
  };

  const handleStartEdit = (u: User) => {
    setIsAddingUser(false);
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditAvatar(u.avatar);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editName.trim()) return;

    // Protection: If editing current admin and changing away from admin while only admin
    if (editingUserId === currentUser.id && editRole !== 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        showAlert('Bạn là Quản trị viên duy nhất, không thể tự giáng cấp vai trò!', 'error');
        return;
      }
    }

    updateUser(editingUserId, {
      name: editName.trim(),
      role: editRole,
      avatar: editAvatar
    });

    setEditingUserId(null);
    showAlert('Đã cập nhật thông tin thành viên!');
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser.id) {
      showAlert('Không thể xóa tài khoản của chính bạn đang đăng nhập!', 'error');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${u.name}" khỏi gia đình?`)) {
      const res = deleteUser(u.id);
      if (res.success) {
        showAlert(`Đã xóa thành viên "${u.name}"!`);
      } else {
        showAlert(res.message || 'Lỗi khi xóa thành viên!', 'error');
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
            <Crown size={11} className="text-amber-500" />
            {t('admin_role_badge_admin')}
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
            <Shield size={11} className="text-indigo-500" />
            {t('admin_role_badge_manager')}
          </span>
        );
      case 'member':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full text-[10px]">
            {t('admin_role_badge_member')}
          </span>
        );
      case 'guest':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full text-[10px]">
            {t('admin_role_badge_guest')}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5 shadow-2xl space-y-4 border-t md:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {t('admin_users_title')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                {t('admin_users_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl text-xs font-bold shrink-0 border border-transparent dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>{t('admin_tab_members')} ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{t('admin_tab_permissions')}</span>
          </button>
        </div>

        {/* Alert notification */}
        {alertMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
          }`}>
            <AlertCircle size={15} />
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Action Button */}
              {!isAddingUser && !editingUserId && (
                <button
                  onClick={handleStartAdd}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Plus size={16} />
                  <span>{t('admin_add_member')}</span>
                </button>
              )}

              {/* Add User Form */}
              {isAddingUser && (
                <form onSubmit={handleSaveNewUser} className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Plus size={14} />
                      {t('admin_add_member')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t('admin_member_name')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={settings.language === 'vi' ? 'VD: Mẹ, Minh Đức, Bé Na, Bà Ngoại...' : settings.language === 'ja' ? '例：お母さん、花子、太郎...' : 'e.g. Mom, Alex, Emily, Grandma...'}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t('admin_role_and_permission')}
                      </label>
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value as UserRole)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="manager">{t('admin_role_badge_manager')} ({t('role_manager')})</option>
                        <option value="member">{t('admin_role_badge_member')} ({t('role_member')})</option>
                        <option value="guest">{t('admin_role_badge_guest')} ({t('role_guest')})</option>
                        <option value="admin">{t('admin_role_badge_admin')} ({t('role_admin')})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t('admin_avatar_icon')}
                      </label>
                      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-600">
                        <span className="text-xl pl-1">{newAvatar}</span>
                        <div className="flex gap-1 overflow-x-auto py-0.5">
                          {AVATAR_OPTIONS.map(emo => (
                            <button
                              type="button"
                              key={emo}
                              onClick={() => setNewAvatar(emo)}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center shrink-0 transition ${
                                newAvatar === emo ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                              }`}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
                    >
                      {t('action_cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                    >
                      {t('admin_save_member')}
                    </button>
                  </div>
                </form>
              )}

              {/* Edit User Form */}
              {editingUserId && (
                <form onSubmit={handleSaveEditUser} className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/60 pb-2">
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Edit2 size={14} />
                      {t('admin_edit_member')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t('admin_member_name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t('admin_role_and_permission')}
                      </label>
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs outline-none focus:border-amber-500 font-semibold"
                      >
                        <option value="admin">{t('admin_role_badge_admin')} ({t('role_admin')})</option>
                        <option value="manager">{t('admin_role_badge_manager')} ({t('role_manager')})</option>
                        <option value="member">{t('admin_role_badge_member')} ({t('role_member')})</option>
                        <option value="guest">{t('admin_role_badge_guest')} ({t('role_guest')})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {t('admin_avatar_icon')}
                      </label>
                      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-600">
                        <span className="text-xl pl-1">{editAvatar}</span>
                        <div className="flex gap-1 overflow-x-auto py-0.5">
                          {AVATAR_OPTIONS.map(emo => (
                            <button
                              type="button"
                              key={emo}
                              onClick={() => setEditAvatar(emo)}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center shrink-0 transition ${
                                editAvatar === emo ? 'bg-amber-100 ring-2 ring-amber-500' : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                              }`}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold"
                    >
                      {t('action_cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                    >
                      {t('admin_update_member')}
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-2.5">
                {users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  const isOnlyAdmin = u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1;

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0">{u.avatar}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {u.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                                {t('admin_you_badge')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getRoleBadge(u.role)}
                            <span className="text-[10px] text-slate-500 dark:text-slate-300 font-semibold">
                              🏆 {u.points} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 dark:hover:text-white transition"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={14} />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isOnlyAdmin}
                            className={`p-1.5 rounded-xl transition ${
                              isOnlyAdmin
                                ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                            }`}
                            title={isOnlyAdmin ? 'Không thể xóa Admin duy nhất' : 'Xóa thành viên'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <Crown size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{t('admin_privilege_title')}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {t('admin_privilege_desc')}
                  </div>
                </div>
              </div>

              {/* Roles matrix */}
              <div className="space-y-2.5">
                {/* Admin */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👨‍💼</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('admin_role_admin_name')}
                      </span>
                    </div>
                    {getRoleBadge('admin')}
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside pl-1">
                    <li>{t('admin_role_admin_p1')}</li>
                    <li>{t('admin_role_admin_p2')}</li>
                    <li>{t('admin_role_admin_p3')}</li>
                    <li>{t('admin_role_admin_p4')}</li>
                    <li>{t('admin_role_admin_p5')}</li>
                  </ul>
                </div>

                {/* Manager */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👩‍💼</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('admin_role_manager_name')}
                      </span>
                    </div>
                    {getRoleBadge('manager')}
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside pl-1">
                    <li>{t('admin_role_manager_p1')}</li>
                    <li>{t('admin_role_manager_p2')}</li>
                    <li>{t('admin_role_manager_p3')}</li>
                    <li>{t('admin_role_manager_p4')}</li>
                    <li className="text-slate-500 dark:text-slate-400 italic">{t('admin_role_manager_p5')}</li>
                  </ul>
                </div>

                {/* Member */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👦</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('admin_role_member_name')}
                      </span>
                    </div>
                    {getRoleBadge('member')}
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside pl-1">
                    <li>{t('admin_role_member_p1')}</li>
                    <li>{t('admin_role_member_p2')}</li>
                    <li>{t('admin_role_member_p3')}</li>
                    <li>{t('admin_role_member_p4')}</li>
                    <li className="text-slate-500 dark:text-slate-400 italic">{t('admin_role_member_p5')}</li>
                  </ul>
                </div>

                {/* Guest */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👵</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('admin_role_guest_name')}
                      </span>
                    </div>
                    {getRoleBadge('guest')}
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside pl-1">
                    <li>{t('admin_role_guest_p1')}</li>
                    <li className="text-slate-500 dark:text-slate-400 italic">{t('admin_role_guest_p2')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-transparent dark:border-slate-700"
          >
            {t('action_close')}
          </button>
        </div>
      </div>
    </div>
  );
};

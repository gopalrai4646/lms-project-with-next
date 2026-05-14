'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  createStaffRoleRequest, 
  updateStaffRoleRequest, 
  deleteStaffRoleRequest, 
  createStaffUserRequest,
  clearStaffRoleError 
} from '@/store/slices/staffRoleSlice';
import { deleteUserRequest } from '@/store/slices/userSlice';
import { PERMISSION_GROUPS, PERMISSION_MODULES, ALL_PERMISSIONS, Permission, StaffRole } from '@/lib/permissions';
import { 
  ShieldCheck, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  UserPlus, 
  Users, 
  KeyRound, 
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function StaffManagementPage() {
  const dispatch = useAppDispatch();
  const { roles, loading, error } = useAppSelector(state => state.staffRoles);
  const { users } = useAppSelector(state => state.users);
  const { role: currentUserRole, permissions: userPermissions } = useAppSelector(state => state.auth);
  const { t: i18nT } = useTranslation();
  const t = i18nT('admin', { returnObjects: true }) as any;
  const router = useRouter();

  // Hard guard for admin-only access
  useEffect(() => {
    if (currentUserRole && currentUserRole !== 'admin') {
      router.push('/admin');
    }
  }, [currentUserRole, router]);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUserRole !== 'admin') return null;

  // Role form
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  // Staff user form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Filter staff users from the users list
  const staffUsers = useMemo(() => {
    return users.filter(u => u.role === 'staff');
  }, [users]);

  // Get role name by ID
  const getRoleName = (roleId?: string) => {
    if (!roleId) return t.staff.unassigned;
    const role = roles.find(r => r.id === roleId);
    return role?.name || t.staff.unknownRole;
  };

  // Get staff count for a role
  const getStaffCount = (roleId: string) => {
    return staffUsers.filter(u => u.staffRoleId === roleId).length;
  };

  // Clear error on modal close
  useEffect(() => {
    if (!showRoleModal && !showUserModal) {
      dispatch(clearStaffRoleError());
    }
  }, [showRoleModal, showUserModal, dispatch]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Redux action completion
  useEffect(() => {
    if (isSubmitting && !loading) {
      if (error) {
        // Failed: Keep modal open, error will be shown
        setIsSubmitting(false);
      } else {
        // Succeeded
        setSuccessMessage(editingRole 
          ? i18nT('admin.staff.roleUpdated', { name: roleName }) 
          : i18nT('admin.staff.roleCreated', { name: roleName })
        );
        setShowRoleModal(false);
        setIsSubmitting(false);
      }
    }
  }, [isSubmitting, loading, error, editingRole, roleName]);

  // Redirect if not admin
  if (currentUserRole !== 'admin') return null;

  // Open role modal for creating
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setShowRoleModal(true);
  };

  // Open role modal for editing
  const openEditRole = (role: StaffRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions([...role.permissions]);
    setShowRoleModal(true);
  };

  // Toggle permission checkbox
  const togglePermission = (perm: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  // Select/deselect all permissions
  const toggleAllPermissions = () => {
    if (selectedPermissions.length === ALL_PERMISSIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([...ALL_PERMISSIONS]);
    }
  };

  // Submit role (create or update)
  const handleSubmitRole = () => {
    if (!roleName.trim()) return;
    if (selectedPermissions.length === 0) return;

    setIsSubmitting(true);
    if (editingRole) {
      dispatch(updateStaffRoleRequest({
        id: editingRole.id,
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: selectedPermissions,
      }));
    } else {
      dispatch(createStaffRoleRequest({
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: selectedPermissions,
      }));
    }
  };

  // Delete role
  const handleDeleteRole = (role: StaffRole) => {
    const count = getStaffCount(role.id);
    const msg = count > 0 
      ? i18nT('admin.staff.deleteRoleWithStaff', { name: role.name, count })
      : i18nT('admin.staff.deleteRoleConfirm', { name: role.name });
    
    if (window.confirm(msg)) {
      dispatch(deleteStaffRoleRequest(role.id));
      setSuccessMessage(i18nT('admin.staff.roleDeleted', { name: role.name }));
    }
  };

  // Submit new staff user
  const handleSubmitUser = () => {
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword || !staffRoleId) return;
    if (staffPassword.length < 6) return;

    dispatch(createStaffUserRequest({
      name: staffName.trim(),
      email: staffEmail.trim().toLowerCase(),
      password: staffPassword,
      staffRoleId,
    }));
    setSuccessMessage(i18nT('admin.staff.staffCreated', { name: staffName }));
    setShowUserModal(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPassword('');
    setStaffRoleId('');
  };

  // Remove staff user (delete)
  const handleRemoveStaff = (userId: string, userName: string) => {
    if (window.confirm(i18nT('admin.staff.deleteStaffConfirm', { name: userName }))) {
      dispatch(deleteUserRequest(userId));
      setSuccessMessage(t.staff.staffDeleted);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-5">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-8 md:p-10 text-white shadow-xl shadow-violet-100">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={32} className="text-violet-200" />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t.staff.title}
            </h1>
          </div>
          <p className="text-violet-100 text-lg max-w-2xl opacity-90">
            {t.staff.subtitle}
          </p>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* ─── Section A: Role Definitions ─── */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <KeyRound size={22} className="text-violet-600 md:w-6 md:h-6" />
              {t.staff.roleDefinitions}
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-1">{t.staff.roleDefinitionsSubtitle}</p>
          </div>
          <button
            onClick={openCreateRole}
            className="w-full sm:w-auto px-5 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            {t.staff.createRoleBtn}
          </button>
        </div>

        {roles.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound size={36} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Roles Created Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">Create your first role to start assigning staff members with specific admin permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors truncate max-w-[180px]">{role.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{role.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditRole(role)}
                      className="p-2 hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-xl transition-all"
                      title="Edit role"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRole(role)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                      title="Delete role"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Permissions Tags - Grouped by Module */}
                <div className="space-y-2 mb-4 min-h-[40px]">
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                    const groupPerms = role.permissions.filter(p => 
                      Object.keys(group.subPermissions).includes(p)
                    );
                    if (groupPerms.length === 0) return null;
                    
                    return (
                      <div key={groupKey} className="flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mr-1">
                          {i18nT(group.label)}:
                        </span>
                        {groupPerms.map(perm => (
                          <span key={perm} className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-black uppercase tracking-wider rounded border border-violet-100/50">
                            {i18nT(PERMISSION_MODULES[perm]?.label) || perm}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Staff Count */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                  <Users size={14} />
                  <span className="font-medium">
                    {i18nT('admin.staff.staffMemberCount', { count: getStaffCount(role.id) })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Section B: Staff Members ─── */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users size={22} className="text-violet-600 md:w-6 md:h-6" />
              {t.staff.activeStaff}
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-1">{t.staff.activeStaffSubtitle}</p>
          </div>
          <button
            onClick={() => {
              setShowUserModal(true);
              setStaffName('');
              setStaffEmail('');
              setStaffPassword('');
              setStaffRoleId('');
              setShowPassword(false);
            }}
            disabled={roles.length === 0}
            className="w-full sm:w-auto px-5 py-3 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={18} />
            {t.staff.createStaff}
          </button>
        </div>

        {staffUsers.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus size={36} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Staff Members Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {roles.length === 0 
                ? 'Create a role first, then add staff members.' 
                : 'Add your first staff member by clicking "Add Staff" above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {staffUsers.map(user => {
              const userRole = roles.find(r => r.id === user.staffRoleId);
              return (
                <div key={user.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-500 group relative overflow-hidden">
                  {/* Background Decoration */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 font-bold text-xl flex items-center justify-center shrink-0 border border-violet-100 shadow-sm group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 group-hover:text-violet-600 transition-colors truncate max-w-[150px]">{user.name || t.noName}</p>
                        <p className="text-xs text-slate-400 font-bold truncate max-w-[150px] uppercase tracking-tight">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveStaff(user.id, user.name || user.email)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                      title={t.staff.deleteStaffConfirm}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 mt-auto relative z-10">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.staff.staffRole}</span>
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-violet-100 shadow-sm">
                          {getRoleName(user.staffRoleId)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.staff.permissions}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {userRole?.permissions.slice(0, 4).map(perm => {
                          const label = i18nT(PERMISSION_MODULES[perm]?.label) || perm;
                          return (
                            <span key={perm} className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded-md border border-slate-100 group-hover:bg-violet-50/50 group-hover:text-violet-600 group-hover:border-violet-100 transition-colors">
                              {label}
                            </span>
                          );
                        })}
                        {(userRole?.permissions.length || 0) > 4 && (
                          <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[9px] font-bold rounded-md border border-slate-100">
                            +{(userRole?.permissions.length || 0) - 4}
                          </span>
                        )}
                        {(userRole?.permissions.length || 0) === 0 && (
                          <span className="text-[10px] font-bold text-slate-400 italic">{t.staff.unassigned}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Role Modal ─── */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingRole ? i18nT('admin.staff.editRole', { name: editingRole.name }) : t.staff.createRole}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} className="text-black" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Show Error inside Modal if submitting */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Role Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.staff.roleNameLabel}</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Content Manager"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.staff.description}</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="e.g. Can manage courses and training plans"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Permissions */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-slate-700">{t.staff.permissions} *</label>
                  <button 
                    onClick={toggleAllPermissions}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    {selectedPermissions.length === ALL_PERMISSIONS.length ? t.staff.deselectAll : t.staff.selectAll}
                  </button>
                </div>
                <div className="space-y-4">
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                    <div key={groupKey} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800">{i18nT(group.label)}</h3>
                      </div>
                      <div className="p-2 space-y-1">
                        {Object.entries(group.subPermissions).map(([permKey, subPerm]) => {
                          const perm = permKey as Permission;
                          return (
                            <label 
                              key={perm} 
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                selectedPermissions.includes(perm) 
                                  ? 'bg-violet-50 border border-violet-200' 
                                  : 'hover:bg-slate-100 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                className="w-4 h-4 accent-violet-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-[13px] font-bold text-slate-700 leading-tight">{i18nT(subPerm.label)}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{i18nT(subPerm.description)}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedPermissions.length === 0 && (
                  <p className="text-xs text-rose-500 font-medium mt-2">{t.staff.selectAtLeastOnePermission}</p>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitRole}
                disabled={!roleName.trim() || selectedPermissions.length === 0 || loading}
                className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? t.savingEllipsis : editingRole ? i18nT('admin.staff.updateRoleBtn') : t.staff.createRoleBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Staff Modal ─── */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{t.staff.createStaff}</h2>
              <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} className="text-black" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.fullName} *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.staff.emailAddress} *</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.staff.password} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {staffPassword && staffPassword.length < 6 && (
                  <p className="text-xs text-rose-500 font-medium mt-2">Password must be at least 6 characters</p>
                )}
              </div>

              {/* Assign Role */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t.staff.staffRole} *</label>
                <div className="relative">
                  <select
                    value={staffRoleId}
                    onChange={(e) => setStaffRoleId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-700 cursor-pointer appearance-none transition-all"
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} — {i18nT('admin.staff.permissionsCount', { count: role.permissions.length })}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm text-amber-700 font-medium">
                  💡 After creating the account, share the email and password with the staff member. They will log in through the regular login page.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitUser}
                disabled={!staffName.trim() || !staffEmail.trim() || staffPassword.length < 6 || !staffRoleId || loading}
                className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? t.savingEllipsis : t.staff.createStaffBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

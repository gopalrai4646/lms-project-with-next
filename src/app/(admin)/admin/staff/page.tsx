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
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, UI_COMPONENTS, BUTTONS } from '@/constants/ui';
import CustomSelect from '@/components/common/CustomSelect';

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
    <div className={`${UI_COMPONENTS.pageContainer} animate-in fade-in duration-700`}>
      {/* ─── Page Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className={TYPOGRAPHY.h1}>{t.staff.title}</h1>
            <p className={`${TYPOGRAPHY.body} mt-1`}>{t.staff.subtitle}</p>
          </div>
        </div>
      </header>

      {/* ─── Success/Error Banners ─── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-700 rounded-lg text-sm font-medium animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Section A: Role Definitions ─── */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className={`${TYPOGRAPHY.h2} flex items-center gap-2`}>
              <KeyRound size={20} className="text-primary-600" />
              {t.staff.roleDefinitions}
            </h2>
            <p className={`${TYPOGRAPHY.body} mt-1`}>{t.staff.roleDefinitionsSubtitle}</p>
          </div>
          <button onClick={openCreateRole} className={`${BUTTONS.primary} w-full sm:w-auto`}>
            <Plus size={16} />
            {t.staff.createRoleBtn}
          </button>
        </div>

        {roles.length === 0 ? (
          <div className={`${UI_COMPONENTS.card} items-center justify-center py-16 text-center`}>
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <KeyRound size={28} className="text-slate-400" />
            </div>
            <h3 className={`${TYPOGRAPHY.h3} mb-2`}>{t.noRolesCreated || "No Roles Created Yet"}</h3>
            <p className={`${TYPOGRAPHY.body} max-w-sm mx-auto`}>Create your first role to start assigning staff members with specific admin permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map(role => (
              <div key={role.id} className={`${UI_COMPONENTS.cardInteractive} group`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className={`${TYPOGRAPHY.h3} group-hover:text-primary-600 transition-colors line-clamp-1 break-all`}>{role.name}</h3>
                    <p className={`${TYPOGRAPHY.body} text-xs mt-1 line-clamp-2 break-all`}>{role.description || (t.noRoleDescription || 'No description')}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditRole(role); }}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-primary-600`}
                      title="Edit role"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                      className={`${BUTTONS.ghost} !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50`}
                      title="Delete role"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Permissions Tags - Grouped by Module */}
                <div className="space-y-2.5 mb-4 flex-grow">
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                    const groupPerms = role.permissions.filter(p =>
                      Object.keys(group.subPermissions).includes(p)
                    );
                    if (groupPerms.length === 0) return null;

                    return (
                      <div key={groupKey} className="flex flex-wrap gap-1.5 items-center">
                        <span className={`${TYPOGRAPHY.label} !text-[10px] mr-1`}>
                          {i18nT(group.label)}:
                        </span>
                        {groupPerms.map(perm => (
                          <span key={perm} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200">
                            {i18nT(PERMISSION_MODULES[perm]?.label) || perm}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Staff Count */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-auto">
                  <Users size={14} />
                  <span>
                    {i18nT('admin.staff.staffMemberCount', { count: getStaffCount(role.id) })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Section B: Staff Members ─── */}
      <section className="mt-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className={`${TYPOGRAPHY.h2} flex items-center gap-2`}>
              <Users size={20} className="text-primary-600" />
              {t.staff.activeStaff}
            </h2>
            <p className={`${TYPOGRAPHY.body} mt-1`}>{t.staff.activeStaffSubtitle}</p>
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
            className={`${BUTTONS.primary} w-full sm:w-auto`}
          >
            <UserPlus size={16} />
            {t.staff.createStaff}
          </button>
        </div>

        {staffUsers.length === 0 ? (
          <div className={`${UI_COMPONENTS.card} items-center justify-center py-16 text-center`}>
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <UserPlus size={28} className="text-slate-400" />
            </div>
            <h3 className={`${TYPOGRAPHY.h3} mb-2`}>{t.noStaffMembers || "No Staff Members Yet"}</h3>
            <p className={`${TYPOGRAPHY.body} max-w-sm mx-auto`}>
              {roles.length === 0
                ? 'Create a role first, then add staff members.'
                : 'Add your first staff member by clicking "Add Staff" above.'}
            </p>
          </div>
        ) : (
          <div className={UI_COMPONENTS.gridContainer}>
            {staffUsers.map(user => {
              const userRole = roles.find(r => r.id === user.staffRoleId);
              return (
                <div key={user.id} className={`${UI_COMPONENTS.card} relative overflow-hidden group`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 font-semibold text-lg flex items-center justify-center shrink-0 border border-primary-100">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          user.name?.charAt(0) || user.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`${TYPOGRAPHY.h3} truncate`}>{user.name || t.noName}</p>
                        <p className={`${TYPOGRAPHY.body} text-xs truncate mt-0.5`}>{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStaff(user.id, user.name || user.email)}
                      className={`${BUTTONS.ghost} shrink-0 !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity`}
                      title={t.staff.deleteStaffConfirm}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className={`${TYPOGRAPHY.label} !text-[10px]`}>{t.staff.staffRole}</span>
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-primary-100">
                        {getRoleName(user.staffRoleId)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <p className={`${TYPOGRAPHY.label} !text-[10px] mb-2`}>{t.staff.permissions}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {userRole?.permissions.slice(0, 4).map(perm => {
                          const label = i18nT(PERMISSION_MODULES[perm]?.label) || perm;
                          return (
                            <span key={perm} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200">
                              {label}
                            </span>
                          );
                        })}
                        {(userRole?.permissions.length || 0) > 4 && (
                          <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-medium rounded-md border border-slate-200">
                            +{(userRole?.permissions.length || 0) - 4}
                          </span>
                        )}
                        {(userRole?.permissions.length || 0) === 0 && (
                          <span className="text-[10px] font-medium text-slate-400 italic">{t.staff.unassigned}</span>
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
        <div className={UI_COMPONENTS.modalBackdrop}>
          <div className={UI_COMPONENTS.modalContent}>
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
              <h2 className={TYPOGRAPHY.h2}>
                {editingRole ? i18nT('admin.staff.editRole', { name: editingRole.name }) : t.staff.createRole}
              </h2>
              <button onClick={() => setShowRoleModal(false)} className={`${BUTTONS.ghost} !p-2`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Show Error inside Modal if submitting */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 text-rose-700 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Role Name */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.staff.roleNameLabel}</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder={t.roleNamePlaceholder || "e.g. Content Manager"}
                  className={UI_COMPONENTS.input}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.staff.description}</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder={t.roleDescPlaceholder || "e.g. Can manage courses and training plans"}
                  className={UI_COMPONENTS.input}
                />
              </div>

              {/* Permissions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`${TYPOGRAPHY.label}`}>{t.staff.permissions} *</label>
                  <button
                    onClick={toggleAllPermissions}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    {selectedPermissions.length === ALL_PERMISSIONS.length ? t.staff.deselectAll : t.staff.selectAll}
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                    <div key={groupKey} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-800">{i18nT(group.label)}</h3>
                      </div>
                      <div className="p-2 space-y-1">
                        {Object.entries(group.subPermissions).map(([permKey, subPerm]) => {
                          const perm = permKey as Permission;
                          const isSelected = selectedPermissions.includes(perm);
                          return (
                            <label
                              key={perm}
                              className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${isSelected
                                  ? 'bg-primary-50 border-primary-200'
                                  : 'hover:bg-slate-100 border-transparent'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(perm)}
                                className="w-4 h-4 mt-0.5 accent-primary-600 rounded border-slate-300"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{i18nT(subPerm.label)}</p>
                                <p className="text-xs text-slate-500 mt-1">{i18nT(subPerm.description)}</p>
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
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={BUTTONS.secondary}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRole}
                  disabled={!roleName.trim() || selectedPermissions.length === 0 || loading}
                  className={BUTTONS.primary}
                >
                  {loading ? t.savingEllipsis : editingRole ? i18nT('admin.staff.updateRoleBtn') : t.staff.createRoleBtn}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Staff Modal ─── */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className={TYPOGRAPHY.h2}>{t.staff.createStaff}</h2>
              <button onClick={() => setShowUserModal(false)} className={`${BUTTONS.ghost} !p-2`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.fullName} *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={t.staffNamePlaceholder || "e.g. John Smith"}
                  className={UI_COMPONENTS.input}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.staff.emailAddress} *</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className={UI_COMPONENTS.input}
                />
              </div>

              {/* Password */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.staff.password} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder={t.passwordMinPlaceholder || "Min. 6 characters"}
                    className={`${UI_COMPONENTS.input} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {staffPassword && staffPassword.length < 6 && (
                  <p className="text-xs text-rose-500 font-medium mt-1.5">Password must be at least 6 characters</p>
                )}
              </div>

              {/* Assign Role */}
              <div>
                <label className={`${TYPOGRAPHY.label} block mb-1.5`}>{t.staff.staffRole} *</label>
                <CustomSelect
                  value={staffRoleId}
                  onChange={(val) => setStaffRoleId(val)}
                  options={[
                    { value: '', label: 'Select a role...' },
                    ...roles.map(role => ({
                      value: role.id,
                      label: `${role.name} — ${i18nT('admin.staff.permissionsCount', { count: role.permissions.length })}`
                    }))
                  ]}
                />
              </div>

              {/* Info box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Note:</span> After creating the account, share the email and password with the staff member. They will log in through the regular login page.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowUserModal(false)}
                  className={BUTTONS.secondary}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitUser}
                  disabled={!staffName.trim() || !staffEmail.trim() || staffPassword.length < 6 || !staffRoleId || loading}
                  className={BUTTONS.primary}
                >
                  {loading ? t.savingEllipsis : t.staff.createStaffBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

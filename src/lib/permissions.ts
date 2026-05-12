/**
 * Permission system for Staff Role-Based Access Control (RBAC).
 * 
 * This module defines granular sub-permissions grouped by module.
 * Admins have full access. Staff users only see/access modules and actions
 * they've been granted via their assigned role.
 */

// ─── Granular Sub-Permissions ───
// Each module has specific action-level permissions.

export interface PermissionDetail {
  label: string;
  description: string;
}

export interface PermissionGroup {
  label: string;
  icon: string;
  routes: string[];
  exactMatch?: boolean;
  subPermissions: Record<string, PermissionDetail>;
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  dashboard: {
    label: 'admin.permissions.groups.dashboard.label',
    icon: 'LayoutDashboard',
    routes: ['/admin'],
    exactMatch: true,
    subPermissions: {
      dashboard: {
        label: 'admin.permissions.sub.dashboard.label',
        description: 'admin.permissions.sub.dashboard.desc',
      },
    },
  },
  courses: {
    label: 'admin.permissions.groups.courses.label',
    icon: 'BookOpen',
    routes: ['/admin/courses'],
    subPermissions: {
      courses_read: {
        label: 'admin.permissions.sub.courses_read.label',
        description: 'admin.permissions.sub.courses_read.desc',
      },
      courses_create: {
        label: 'admin.permissions.sub.courses_create.label',
        description: 'admin.permissions.sub.courses_create.desc',
      },
      courses_edit: {
        label: 'admin.permissions.sub.courses_edit.label',
        description: 'admin.permissions.sub.courses_edit.desc',
      },
      courses_delete: {
        label: 'admin.permissions.sub.courses_delete.label',
        description: 'admin.permissions.sub.courses_delete.desc',
      },
    },
  },
  training_plans: {
    label: 'admin.permissions.groups.training_plans.label',
    icon: 'ClipboardList',
    routes: ['/admin/training-plans'],
    subPermissions: {
      training_plans_read: {
        label: 'admin.permissions.sub.training_plans_read.label',
        description: 'admin.permissions.sub.training_plans_read.desc',
      },
      training_plans_create: {
        label: 'admin.permissions.sub.training_plans_create.label',
        description: 'admin.permissions.sub.training_plans_create.desc',
      },
      training_plans_edit: {
        label: 'admin.permissions.sub.training_plans_edit.label',
        description: 'admin.permissions.sub.training_plans_edit.desc',
      },
      training_plans_delete: {
        label: 'admin.permissions.sub.training_plans_delete.label',
        description: 'admin.permissions.sub.training_plans_delete.desc',
      },
      training_plans_assign: {
        label: 'admin.permissions.sub.training_plans_assign.label',
        description: 'admin.permissions.sub.training_plans_assign.desc',
      },
    },
  },
  users: {
    label: 'admin.permissions.groups.users.label',
    icon: 'Users',
    routes: ['/admin/users'],
    subPermissions: {
      users_read: {
        label: 'admin.permissions.sub.users_read.label',
        description: 'admin.permissions.sub.users_read.desc',
      },
      users_impersonate: {
        label: 'admin.permissions.sub.users_impersonate.label',
        description: 'admin.permissions.sub.users_impersonate.desc',
      },
      users_delete: {
        label: 'admin.permissions.sub.users_delete.label',
        description: 'admin.permissions.sub.users_delete.desc',
      },
    },
  },
  top_courses: {
    label: 'admin.permissions.groups.top_courses.label',
    icon: 'BarChart3',
    routes: ['/admin/top-courses'],
    subPermissions: {
      top_courses: {
        label: 'admin.permissions.sub.top_courses.label',
        description: 'admin.permissions.sub.top_courses.desc',
      },
    },
  },
  top_training_plans: {
    label: 'admin.permissions.groups.top_training_plans.label',
    icon: 'Award',
    routes: ['/admin/top-training-plans'],
    subPermissions: {
      top_training_plans: {
        label: 'admin.permissions.sub.top_training_plans.label',
        description: 'admin.permissions.sub.top_training_plans.desc',
      },
    },
  },
} as const;

// ─── Type Definitions ───

// All possible granular permission keys (e.g. 'courses_read', 'users_impersonate', etc.)
type SubPermissionKeys<T> = T extends { subPermissions: infer S } ? keyof S : never;
export type Permission = SubPermissionKeys<typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS]>;

// Module group keys (e.g. 'courses', 'training_plans', etc.)
export type ModuleGroup = keyof typeof PERMISSION_GROUPS;

// Collect all permission keys
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSION_GROUPS).flatMap(
  group => Object.keys(group.subPermissions)
) as Permission[];

// For backward compatibility: flat lookup map from permission key to its label/description
export const PERMISSION_MODULES: Record<string, { label: string; description: string }> = {};
for (const group of Object.values(PERMISSION_GROUPS)) {
  for (const [key, sub] of Object.entries(group.subPermissions)) {
    PERMISSION_MODULES[key] = { label: sub.label, description: sub.description };
  }
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

/**
 * Check if a user has ANY sub-permission for a given module group.
 * E.g., hasModuleAccess(permissions, 'courses') returns true if the user
 * has courses_read, courses_create, or courses_edit.
 */
export function hasModuleAccess(permissions: Permission[], moduleGroup: ModuleGroup): boolean {
  const group = PERMISSION_GROUPS[moduleGroup];
  if (!group) return false;
  const subKeys = Object.keys(group.subPermissions) as Permission[];
  return subKeys.some(key => permissions.includes(key));
}

/**
 * Given a pathname, determine which module group is required to access it.
 * Returns null if the route doesn't map to any permission (e.g., /admin/staff which is admin-only).
 */
export function getPermissionForRoute(pathname: string): ModuleGroup | null {
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    for (const route of group.routes) {
      if ('exactMatch' in group && group.exactMatch) {
        if (pathname === route) return key as ModuleGroup;
      } else {
        if (pathname === route || pathname.startsWith(route + '/')) {
          return key as ModuleGroup;
        }
      }
    }
  }
  return null;
}

/**
 * Get the first allowed admin route for a set of permissions.
 * Used to redirect staff to their "home" page when they land on an unauthorized route.
 */
export function getFirstAllowedRoute(permissions: Permission[]): string {
  const priority: ModuleGroup[] = ['dashboard', 'courses', 'training_plans', 'users', 'top_courses', 'top_training_plans'];

  for (const mod of priority) {
    if (hasModuleAccess(permissions, mod)) {
      return PERMISSION_GROUPS[mod].routes[0];
    }
  }

  return '/admin';
}

/**
 * Firestore interface for a staff role definition.
 */
export interface StaffRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  createdBy: string;
}

import { Agency } from '../models/agency.model';
import { Role, RoleType } from '../../shared/models/role.model';
import { Permission } from '../../shared/models/permission.model';

class AgencyRoleService {
  // Create default roles for a new agency
  async createDefaultRoles(agencyId: string): Promise<void> {
    const defaultRoles = [
      {
        name: 'Super Admin',
        type: 'super_admin' as RoleType,
        description: 'Full access to all features and settings',
        permissions: ['*'], // All permissions
        isSystem: true,
      },
      {
        name: 'Manager',
        type: 'manager' as RoleType,
        description: 'Access to manage team and view reports',
        permissions: ['users:read', 'users:create', 'users:update', 'reports:read', 'leads:read', 'leads:update'],
        isSystem: true,
      },
      {
        name: 'Agent',
        type: 'agent' as RoleType,
        description: 'Access to manage leads and basic features',
        permissions: ['leads:read', 'leads:create', 'leads:update'],
        isSystem: true,
      },
    ];

    for (const roleData of defaultRoles) {
      await Role.create({
        ...roleData,
        agency: agencyId,
      });
    }
  }

  // Update role permissions
  async updateRolePermissions(agencyId: string, roleType: RoleType, permissions: string[]): Promise<void> {
    const role = await Role.findOne({ agency: agencyId, type: roleType });
    if (!role) {
      throw new Error('Role not found');
    }

    // Verify all permissions exist
    const existingPermissions = await Permission.find({
      _id: { $in: permissions },
    });

    if (existingPermissions.length !== permissions.length) {
      throw new Error('One or more permissions do not exist');
    }

    role.permissions = permissions;
    await role.save();
  }

  // Get role permissions
  async getRolePermissions(agencyId: string, roleType: RoleType): Promise<string[]> {
    const role = await Role.findOne({ agency: agencyId, type: roleType });
    if (!role) {
      throw new Error('Role not found');
    }

    return role.permissions;
  }

  // Check if user has permission
  async hasPermission(agencyId: string, roleType: RoleType, permission: string): Promise<boolean> {
    const role = await Role.findOne({ agency: agencyId, type: roleType });
    if (!role) {
      return false;
    }

    // Super admin has all permissions
    if (role.type === 'super_admin') {
      return true;
    }

    return role.permissions.includes(permission);
  }

  // Get all roles for an agency
  async getAgencyRoles(agencyId: string): Promise<any[]> {
    const roles = await Role.find({ agency: agencyId }).populate('permissions').lean();

    return roles.map((role) => ({
      id: role._id,
      name: role.name,
      type: role.type,
      description: role.description,
      permissions: role.permissions,
    }));
  }
}

export const agencyRoleService = new AgencyRoleService();

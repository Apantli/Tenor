---
sidebar_position: 5
---

# Roles & Permissions

Tenor uses a flexible role-based access control system to manage permissions within projects.

## Default Roles

Tenor includes the following predefined roles:

### Owner

- Created automatically for the project creator
- Cannot be modified or reassigned
- Has full access to all project areas
- Can delete the project

### Admin

- Full editing and management capabilities:
  - Can modify project settings
  - Can manage team members
  - Can create, edit, and delete all project items
  - Can manage sprints and workflow
  - Can view performance metrics

### Developer

- Standard contributor role:
  - Can view project settings
  - Can view team members
  - Can create and edit items in the backlog
  - Can manage tasks on the scrum board
  - Can participate in sprints
  - Cannot access sensitive project settings

### Viewer

- Read-only access to the project:
  - Can view project information
  - Cannot create or edit any items
  - Cannot manage team or settings

## Permission Areas

Tenor divides permissions into six main areas:

### Settings
Controls access to project configuration:
- **Level 0**: No access to settings
- **Level 1**: View-only access to settings
- **Level 2**: Full access to modify project settings

### Performance
Controls access to analytics and metrics:
- **Level 0**: No access to performance data
- **Level 1**: View-only access to performance data
- **Level 2**: Full access to configure and analyze performance data

### Sprints
Controls sprint management:
- **Level 0**: View-only access to sprints
- **Level 1**: Can participate in sprints and update tasks
- **Level 2**: Full sprint management (create, edit, delete)

### Scrum Board
Controls access to the Kanban-style task board:
- **Level 0**: View-only access to the scrum board
- **Level 1**: Can update task statuses and assignments
- **Level 2**: Full scrum board management

### Issues
Controls issue management:
- **Level 0**: View-only access to issues
- **Level 1**: Can create and edit issues
- **Level 2**: Full issue management (create, edit, delete)

### Backlog
Controls access to the product backlog:
- **Level 0**: View-only access to backlog items
- **Level 1**: Can create and edit backlog items
- **Level 2**: Full backlog management (create, edit, delete)

## Custom Roles

Project administrators can create custom roles with specific permission combinations:

1. Navigate to Project Settings > Users
2. Click "Add Role"
3. Enter a name for the new role
4. Configure permissions for each area
5. Save the new role

Once created, custom roles can be assigned to team members.

## Managing Team Permissions

To assign roles to team members:

1. Navigate to Project Settings > Users
2. View the current team members list
3. Use the role dropdown next to each user to assign or change roles
4. Changes take effect immediately

## Permission Inheritance

Permissions in Tenor are non-hierarchical. Each permission area is controlled independently, allowing for flexible role configurations based on your team's needs.

## Best Practices

- **Limit Admin Roles**: Assign the Admin role only to trusted team leaders
- **Use Developers Role** for most team members who need to contribute actively
- **Create Specialized Roles** for team members with specific responsibilities
- **Review Permissions Regularly**: Update roles as team responsibilities change
- **Default to Lower Permissions**: Start with minimal permissions and increase as needed
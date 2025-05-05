[**Tenor API Documentation**](../../README.md)

***

# Variable: updateRoleTabPermissionsProcedure

> `const` **updateRoleTabPermissionsProcedure**: `MutationProcedure`\<\{ `input`: \{ `parameter`: `string`; `permission`: `number`; `projectId`: `string`; `roleId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:783](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L783)

Updates role tab permissions for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the role
- roleId — ID of the role to update
- parameter — The permission parameter to update
- permission — The new permission value

## Returns

Void.

## Http

PUT /api/trpc/settings.updateRoleTabPermissions

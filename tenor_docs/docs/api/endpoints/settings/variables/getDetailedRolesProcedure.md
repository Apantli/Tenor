[**Tenor API Documentation**](../../README.md)

***

# Variable: getDetailedRolesProcedure

> `const` **getDetailedRolesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `RoleDetail`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:677](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L677)

Retrieves detailed roles for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch roles from

## Returns

Array of roles with their details.

## Http

GET /api/trpc/settings.getDetailedRoles

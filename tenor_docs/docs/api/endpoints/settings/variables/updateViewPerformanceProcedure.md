[**Tenor API Documentation**](../../README.md)

***

# Variable: updateViewPerformanceProcedure

> `const` **updateViewPerformanceProcedure**: `MutationProcedure`\<\{ `input`: \{ `newValue`: `boolean`; `projectId`: `string`; `roleId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:818](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L818)

Updates the view performance permission for a role.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the role
- roleId — ID of the role to update
- newValue — The new permission value

## Returns

Void.

## Http

PUT /api/trpc/settings.updateViewPerformance

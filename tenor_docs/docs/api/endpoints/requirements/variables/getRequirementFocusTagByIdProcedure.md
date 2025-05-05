[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementFocusTagByIdProcedure

> `const` **getRequirementFocusTagByIdProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:440](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L440)

Retrieves a specific requirement focus tag by its ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement focus tag
- tagId — ID of the requirement focus tag to fetch

## Returns

Requirement focus tag object with its details.

## Http

GET /api/trpc/requirements.getRequirementFocusTagById

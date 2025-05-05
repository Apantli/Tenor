[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementTypeTagByIdProcedure

> `const` **getRequirementTypeTagByIdProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:289](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L289)

Retrieves a specific requirement type tag by its ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement type tag
- tagId — ID of the requirement type tag to fetch

## Returns

Requirement type tag object with its details.

## Http

GET /api/trpc/requirements.getRequirementTypeTagById

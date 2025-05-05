[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteRequirementProcedure

> `const` **deleteRequirementProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:707](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/requirements.ts#L707)

Deletes a requirement from a project (soft delete).

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement
- requirementId — ID of the requirement to delete

## Returns

Object indicating success status.

## Http

DELETE /api/trpc/requirements.deleteRequirement

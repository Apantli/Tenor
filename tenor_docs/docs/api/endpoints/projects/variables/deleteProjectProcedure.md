[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteProjectProcedure

> `const` **deleteProjectProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:457](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/projects.ts#L457)

Deletes a project by marking it as deleted.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to delete

## Returns

Object indicating success status.

## Http

DELETE /api/trpc/projects.deleteProject

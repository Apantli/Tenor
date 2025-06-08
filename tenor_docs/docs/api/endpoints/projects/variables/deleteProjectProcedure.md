[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteProjectProcedure

> `const` **deleteProjectProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:447](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L447)

Marks a project as deleted.
Requires owner permissions.

## Param

Object containing projectId to delete

## Returns

void

## Throws

If the user doesn't have owner permissions

## Http

POST /api/trpc/projects.deleteProject

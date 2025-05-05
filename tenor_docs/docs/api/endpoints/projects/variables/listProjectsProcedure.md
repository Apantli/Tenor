[**Tenor API Documentation**](../../README.md)

***

# Variable: listProjectsProcedure

> `const` **listProjectsProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `WithId`\<`Project`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:184](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/projects.ts#L184)

Retrieves a list of projects associated with the current user.

## Param

None

## Returns

Array of projects with their details.

## Http

GET /api/trpc/projects.listProjects

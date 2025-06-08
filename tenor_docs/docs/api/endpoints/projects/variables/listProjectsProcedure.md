[**Tenor API Documentation**](../../README.md)

***

# Variable: listProjectsProcedure

> `const` **listProjectsProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `WithId`\<`Project`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:176](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L176)

Lists all projects available to the authenticated user.

## Returns

Array of projects the user has access to

## Http

GET /api/trpc/projects.listProjects

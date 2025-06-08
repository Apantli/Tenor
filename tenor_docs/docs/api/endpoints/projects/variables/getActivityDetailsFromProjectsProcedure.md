[**Tenor API Documentation**](../../README.md)

***

# Variable: getActivityDetailsFromProjectsProcedure

> `const` **getActivityDetailsFromProjectsProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `WithProjectId`\<`WithId`\<`ProjectActivityDetail`\>\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:580](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L580)

Gets activity details from all projects the user has access to.

## Returns

Array of activity details sorted by date

## Http

GET /api/trpc/projects.getActivityDetailsFromProjects

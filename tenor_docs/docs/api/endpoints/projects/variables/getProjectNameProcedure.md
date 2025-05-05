[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectNameProcedure

> `const` **getProjectNameProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `projectName`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:485](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/projects.ts#L485)

Retrieves the name of a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch the name for

## Returns

Object containing the project's name.

## Http

GET /api/trpc/projects.getProjectName

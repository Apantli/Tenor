[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoryTableProcedure

> `const` **getUserStoryTableProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `UserStoryCol`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:85](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L85)

Retrieves a table of user stories for a given project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to retrieve user stories for

## Returns

Array of user story objects formatted as a table

## Http

GET /api/trpc/userStories.getUserStoryTable

[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoriesTableFriendlyProcedure

> `const` **getUserStoriesTableFriendlyProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: [`UserStoryCol`](../interfaces/UserStoryCol.md)[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:251](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/userStories.ts#L251)

Retrieves user stories in a table-friendly format for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch user stories from

## Returns

Array of user stories formatted for table display.

## Http

GET /api/trpc/userStories.getUserStoriesTableFriendly

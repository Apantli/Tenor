[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectUserStoriesOverviewProcedure

> `const` **getProjectUserStoriesOverviewProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:220](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L220)

Retrieves an overview of user stories for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch user stories from

## Returns

Array of user stories with their scrumId and name.

## Http

GET /api/trpc/userStories.getProjectUserStoriesOverview

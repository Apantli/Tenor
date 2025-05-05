[**Tenor API Documentation**](../../README.md)

***

# Variable: fetchScrumSettingsProcedure

> `const` **fetchScrumSettingsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `maximumSprintStoryPoints`: `number`; `sprintDuration`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:963](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L963)

Retrieves Scrum settings for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch Scrum settings from

## Returns

Object containing Scrum settings:
- sprintDuration — Duration of sprints in days
- maximumSprintStoryPoints — Maximum story points per sprint

## Http

GET /api/trpc/settings.fetchScrumSettings

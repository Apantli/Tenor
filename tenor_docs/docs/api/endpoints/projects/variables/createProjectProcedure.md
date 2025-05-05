[**Tenor API Documentation**](../../README.md)

***

# Variable: createProjectProcedure

> `const` **createProjectProcedure**: `MutationProcedure`\<\{ `input`: \{ `activities?`: `object`[]; `currentSprintId?`: `string`; `deleted?`: `boolean`; `description`: `string`; `logo`: `string`; `name`: `string`; `settings`: \{ `aiContext`: \{ `files?`: `object`[]; `links?`: `object`[]; `text?`: `string`; \}; `maximumSprintStoryPoints?`: `number`; `Size?`: `number`[]; `sprintDuration?`: `number`; \}; `users`: `object`[]; \}; `output`: \{ `projectId`: `string`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:207](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/projects.ts#L207)

Creates a new project with the provided settings and users.

## Param

Object containing procedure parameters
Input object structure:
- name — Name of the project
- description — Description of the project
- logo — Base64 string of the project logo
- settings — Project settings including sprint duration, story points, etc.
- users — Array of users with their roles and activity status

## Returns

Object containing the ID of the created project.

## Http

POST /api/trpc/projects.createProject

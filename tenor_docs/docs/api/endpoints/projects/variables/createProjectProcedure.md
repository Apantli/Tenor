[**Tenor API Documentation**](../../README.md)

***

# Variable: createProjectProcedure

> `const` **createProjectProcedure**: `MutationProcedure`\<\{ `input`: \{ `activities?`: `object`[]; `currentSprintId?`: `string`; `deleted?`: `boolean`; `description`: `string`; `logo`: `string`; `name`: `string`; `settings`: \{ `aiContext`: \{ `files?`: `object`[]; `links?`: `object`[]; `text?`: `string`; \}; `Size?`: `number`[]; `sprintDuration?`: `number`; \}; `users`: `object`[]; \}; `output`: \{ `projectId`: `string`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:193](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L193)

Creates a new project with the specified configuration.

## Param

Project configuration including name, description, users, and settings

## Returns

Object containing success status and the new project ID

## Throws

If there's an error creating the project

## Http

POST /api/trpc/projects.createProject

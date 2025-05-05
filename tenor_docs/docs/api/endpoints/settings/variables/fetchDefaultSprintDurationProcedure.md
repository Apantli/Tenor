[**Tenor API Documentation**](../../README.md)

***

# Variable: fetchDefaultSprintDurationProcedure

> `const` **fetchDefaultSprintDurationProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1024](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1024)

Retrieves the default sprint duration for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch the default sprint duration from

## Returns

Default sprint duration in days.

## Http

GET /api/trpc/settings.fetchDefaultSprintDuration

[**Tenor API Documentation**](../../README.md)

***

# Variable: updateScrumSettingsProcedure

> `const` **updateScrumSettingsProcedure**: `MutationProcedure`\<\{ `input`: \{ `days`: `number`; `points`: `number`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:994](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L994)

Updates Scrum settings for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to update Scrum settings for
- days — New sprint duration in days
- points — New maximum story points per sprint

## Returns

Object indicating success status.

## Http

PUT /api/trpc/settings.updateScrumSettings

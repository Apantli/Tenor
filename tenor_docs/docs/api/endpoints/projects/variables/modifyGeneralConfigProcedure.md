[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyGeneralConfigProcedure

> `const` **modifyGeneralConfigProcedure**: `MutationProcedure`\<\{ `input`: \{ `description`: `string`; `logo`: `string`; `name`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:398](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/projects.ts#L398)

Modifies the general configuration of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to modify
- name — New name of the project
- description — New description of the project
- logo — New base64 string of the project logo

## Returns

Object indicating success status.

## Http

PUT /api/trpc/projects.modifyGeneralConfig

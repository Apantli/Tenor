[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyGeneralConfigProcedure

> `const` **modifyGeneralConfigProcedure**: `MutationProcedure`\<\{ `input`: \{ `description`: `string`; `logo`: `string`; `name`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:386](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L386)

Modifies the general configuration of a project.
Requires owner permissions.

## Param

Object containing project configuration updates

## Returns

void

## Throws

If the user doesn't have owner permissions

## Http

POST /api/trpc/projects.modifyGeneralConfig

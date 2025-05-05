[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteRequirementTypeTagProcedure

> `const` **deleteRequirementTypeTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:378](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L378)

Deletes a requirement type tag from a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement type tag
- tagId — ID of the requirement type tag to delete

## Returns

Object containing the ID of the deleted requirement type tag.

## Http

DELETE /api/trpc/requirements.deleteRequirementTypeTag

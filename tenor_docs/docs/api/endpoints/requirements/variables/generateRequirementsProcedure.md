[**Tenor API Documentation**](../../README.md)

***

# Variable: generateRequirementsProcedure

> `const` **generateRequirementsProcedure**: `MutationProcedure`\<\{ `input`: \{ `amount`: `number`; `projectId`: `string`; `prompt`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:748](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L748)

Generates requirements using AI based on existing requirements and project context.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to generate requirements for
- amount — Number of requirements to generate
- prompt — Additional prompt for the AI to consider

## Returns

Array of generated requirements with their details.

## Http

POST /api/trpc/requirements.generateRequirements

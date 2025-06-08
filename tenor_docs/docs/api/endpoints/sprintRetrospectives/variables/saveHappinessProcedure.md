[**Tenor API Documentation**](../../README.md)

***

# Variable: saveHappinessProcedure

> `const` **saveHappinessProcedure**: `MutationProcedure`\<\{ `input`: \{ `happiness`: `number`; `projectId`: `string`; `reviewId`: `number`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:157](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L157)

Saves a happiness rating for a retrospective.

## Param

Object containing procedure parameters
Input object structure:
- reviewId - Numeric ID of the retrospective review
- happiness - Numeric rating between 1 and 10

## Returns

Object indicating success status

## Throws

- If the happiness rating is not between 1 and 10

## Http

POST /api/trpc/sprintRetrospectives.saveHappiness

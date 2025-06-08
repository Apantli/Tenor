[**Tenor API Documentation**](../../README.md)

***

# Variable: getRetrospectiveAnswersProcedure

> `const` **getRetrospectiveAnswersProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `reviewId`: `number`; `userId`: `string`; \}; `output`: `RetrospectiveAnswers`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:76](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L76)

Retrieves all retrospective answers for a specific user and review.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- reviewId - Numeric ID of the retrospective review
- userId - String ID of the user

## Returns

Record of retrospective answers keyed by question identifier

## Throws

- If there's a problem retrieving answers from the database

## Http

GET /api/trpc/sprintRetrospectives.getRetrospectiveAnswers

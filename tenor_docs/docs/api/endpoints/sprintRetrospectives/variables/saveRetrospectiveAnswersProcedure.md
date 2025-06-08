[**Tenor API Documentation**](../../README.md)

***

# Variable: saveRetrospectiveAnswersProcedure

> `const` **saveRetrospectiveAnswersProcedure**: `MutationProcedure`\<\{ `input`: \{ `answerText`: `string`; `projectId`: `string`; `questionNum`: `number`; `reviewId`: `number`; `userId`: `string`; \}; `output`: `boolean`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:116](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L116)

Saves a single retrospective answer for a specific question.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- reviewId - Numeric ID of the retrospective review
- userId - String ID of the user
- questionNum - Number identifying the question
- answerText - Text response to the question

## Returns

Boolean indicating success of the operation

## Throws

- If there's a problem saving the answer to the database

## Http

POST /api/trpc/sprintRetrospectives.saveRetrospectiveAnswers

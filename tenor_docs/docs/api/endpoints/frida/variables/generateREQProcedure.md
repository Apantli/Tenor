[**Tenor API Documentation**](../../README.md)

***

# Variable: generateREQProcedure

> `const` **generateREQProcedure**: `QueryProcedure`\<\{ `input`: `string`; `output`: `APIResponse`; \}\>

Defined in: [tenor\_web/src/server/api/routers/frida.ts:39](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/frida.ts#L39)

Generates a list of functional and non-functional requirements based on the provided context.

## Param

Object containing procedure parameters
Input object structure:
- context — Context for generating the requirements

## Returns

Object containing the success status, generated data, message, and any error details.

## Http

POST /api/trpc/frida.generateREQ

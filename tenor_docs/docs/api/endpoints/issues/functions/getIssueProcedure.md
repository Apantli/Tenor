---
sidebar_label: "GetIssueProcedure"
---

# Function: GetIssueProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: getIssueProcedure()

> **getIssueProcedure**(`opts`): `Promise`\<`WithId`\<`Issue`\>\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:63](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L63)

**`Internal`**

getIssueProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<`WithId`\<`Issue`\>\>

- A promise that resolves to the issue data or null if not found.

## Description

Retrieves a specific issue by its ID within a project.

## Param

The ID of the project.

## Param

The ID of the issue to retrieve.

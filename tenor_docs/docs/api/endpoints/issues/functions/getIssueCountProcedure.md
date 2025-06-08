---
sidebar_label: "GetIssueCountProcedure"
---

# Function: GetIssueCountProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: getIssueCountProcedure()

> **getIssueCountProcedure**(`opts`): `Promise`\<`number`\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:327](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L327)

**`Internal`**

getIssueCountProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<`number`\>

- The number of issues in the project.

## Description

Retrieves the number of issues inside a given project, regardless of their deleted status.

## Param

The ID of the project.

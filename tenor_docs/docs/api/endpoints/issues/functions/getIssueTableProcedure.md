---
sidebar_label: "GetIssueTableProcedure"
---

# Function: GetIssueTableProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: getIssueTableProcedure()

> **getIssueTableProcedure**(`opts`): `Promise`\<`IssueCol`[]\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:43](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L43)

**`Internal`**

getIssueTableProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<`IssueCol`[]\>

- A promise that resolves to an array of issues.

## Description

Retrieves all issues for a given project.

## Param

The ID of the project to retrieve issues for.

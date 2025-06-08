---
sidebar_label: "GetAllIssuesProcedure"
---

# Function: GetAllIssuesProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: getAllIssuesProcedure()

> **getAllIssuesProcedure**(`opts`): `Promise`\<`WithId`\<`Issue`\>[]\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:342](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L342)

**`Internal`**

getAllIssuesProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<`WithId`\<`Issue`\>[]\>

- A promise that resolves to an array of issues.

## Description

Retrieves all issues for a given project.

## Param

The ID of the project to retrieve issues for.

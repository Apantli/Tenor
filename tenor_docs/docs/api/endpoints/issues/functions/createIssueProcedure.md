---
sidebar_label: "CreateIssueProcedure"
---

# Function: CreateIssueProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: createIssueProcedure()

> **createIssueProcedure**(`opts`): `Promise`\<\{ `issueId`: `string`; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:76](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L76)

**`Internal`**

createIssueProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<\{ `issueId`: `string`; \}\>

## Description

Creates a new issue within a project.

## Param

The ID of the project to create the issue in.

## Param

The data for the issue to create.

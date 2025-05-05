---
sidebar_label: "GetTasksFromProject"
---

# Function: GetTasksFromProject

[**Tenor API Documentation**](../../README.md)

***

# Function: getTasksFromProject()

> **getTasksFromProject**(`dbAdmin`, `projectId`): `Promise`\<`WithId`\<`Task`\>[]\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:53](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L53)

getTasksFromProject

## Parameters

### dbAdmin

`Firestore`

The Firestore database instance

### projectId

`string`

The ID of the project to retrieve tasks from

## Returns

`Promise`\<`WithId`\<`Task`\>[]\>

An array of task objects with their IDs

## Description

Retrieves all non-deleted tasks from a project, ordered by scrumId

---
sidebar_label: "GetTasksFromProject"
---

# Function: GetTasksFromProject

[**Tenor API Documentation**](../../README.md)

***

# Function: getTasksFromProject()

> **getTasksFromProject**(`dbAdmin`, `projectId`): `Promise`\<`WithId`\<`Task`\>[]\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:73](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L73)

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

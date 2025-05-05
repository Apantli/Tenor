---
sidebar_label: "TaskCol"
---

# Interface: TaskCol

[**Tenor API Documentation**](../../README.md)

***

# Interface: TaskCol

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:34](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L34)

TaskCol

## Description

Represents a task in a table-friendly format for the UI

## Properties

### assignee?

> `optional` **assignee**: `object`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:39](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L39)

The optional user assigned to the task

#### displayName

> **displayName**: `string`

#### photoURL

> **photoURL**: `string`

#### uid

> **uid**: `string`

***

### id

> **id**: `string`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:35](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L35)

The unique identifier of the task

***

### scrumId?

> `optional` **scrumId**: `number`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:36](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L36)

The optional scrum ID of the task

***

### status

> **status**: `StatusTag`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:38](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L38)

The status tag of the task

***

### title

> **title**: `string`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:37](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L37)

The title/name of the task

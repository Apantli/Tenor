---
sidebar_label: "TaskCol"
---

# Interface: TaskCol

[**Tenor API Documentation**](../../README.md)

***

# Interface: TaskCol

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:54](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L54)

TaskCol

## Description

Represents a task in a table-friendly format for the UI

## Properties

### assignee?

> `optional` **assignee**: `object`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:59](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L59)

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

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:55](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L55)

The unique identifier of the task

***

### scrumId?

> `optional` **scrumId**: `number`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:56](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L56)

The optional scrum ID of the task

***

### status

> **status**: `StatusTag`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:58](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L58)

The status tag of the task

***

### title

> **title**: `string`

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:57](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/tasks.ts#L57)

The title/name of the task

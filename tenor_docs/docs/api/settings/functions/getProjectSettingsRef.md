---
sidebar_label: "GetProjectSettingsRef"
---

# Function: GetProjectSettingsRef

[**Tenor API Documentation**](../../README.md)

***

# Function: getProjectSettingsRef()

> **getProjectSettingsRef**(`projectId`, `firestore`): `DocumentReference`\<`DocumentData`, `DocumentData`\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:61](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/settings.ts#L61)

getProjectSettingsRef

## Parameters

### projectId

`string`

The ID of the project

### firestore

`Firestore`

The Firestore instance

## Returns

`DocumentReference`\<`DocumentData`, `DocumentData`\>

A reference to the project settings document

## Description

Gets a reference to the project settings document

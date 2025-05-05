---
sidebar_label: "GetProjectSettingsRef"
---

# Function: GetProjectSettingsRef

[**Tenor API Documentation**](../../README.md)

***

# Function: getProjectSettingsRef()

> **getProjectSettingsRef**(`projectId`, `firestore`): `DocumentReference`\<`DocumentData`, `DocumentData`\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:81](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L81)

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

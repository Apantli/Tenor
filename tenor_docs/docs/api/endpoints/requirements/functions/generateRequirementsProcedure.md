---
sidebar_label: "GenerateRequirementsProcedure"
---

# Function: GenerateRequirementsProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: generateRequirementsProcedure()

> **generateRequirementsProcedure**(`opts`): `Promise`\<`RequirementCol`[]\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:473](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L473)

**`Internal`**

generateRequirements

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<`RequirementCol`[]\>

An array of generated requirements.

## Description

Retrieves the context for generating requirements based on the project ID and amount.

## Param

The ID of the project.

## Param

The number of requirements to generate.

## Param

The prompt to use for generating requirements.

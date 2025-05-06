---
sidebar_label: "AI API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# ai

AI Router - Tenor API Endpoints for AI-related functionality

This file defines the TRPC router and procedures for AI-powered features in the Tenor application.
It provides endpoints to generate text completions based on user prompts and context.

The main procedure ([generateAutocompletionProcedure](variables/generateAutocompletionProcedure.md)) takes user messages and related context,
formats them into a prompt for an AI model, and returns both a brief description
of changes and an autocompletion response.

## Type Aliases

- [ContextObject](type-aliases/ContextObject.md)

## Variables

- [aiRouter](variables/aiRouter.md)
- [ContextObjectSchema](variables/ContextObjectSchema.md)
- [generateAutocompletionProcedure](variables/generateAutocompletionProcedure.md)

## Functions

- [parseContext](functions/parseContext.md)

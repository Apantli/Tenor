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

The main procedure ([generateAutocompletion](variables/generateAutocompletion.md)) takes user messages and related context,
formats them into a prompt for an AI model, and returns both a brief description
of changes and an autocompletion response.

## Variables

- [aiRouter](variables/aiRouter.md)
- [generateAutocompletion](variables/generateAutocompletion.md)

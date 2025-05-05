---
sidebar_label: "Requirements API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# requirements

Requirements Router - Tenor API Endpoints for Requirements Management

This file defines the TRPC router and procedures for managing requirements in the Tenor application.
It provides endpoints to create, read, update, delete, and generate software requirements.

The router includes procedures for:
- Managing requirement type and focus tags
- Creating and modifying requirements
- Retrieving requirements in a table-friendly format
- Generating new requirements using AI
- Deleting requirements (soft delete)

Requirements represent functional and non-functional specifications that define
what the software system must do or how it must perform.

## Interfaces

- [RequirementCol](interfaces/RequirementCol.md)

## Variables

- [createOrModifyRequirementProcedure](variables/createOrModifyRequirementProcedure.md)
- [createRequirementFocusTagProcedure](variables/createRequirementFocusTagProcedure.md)
- [createRequirementTypeTagProcedure](variables/createRequirementTypeTagProcedure.md)
- [deleteRequirementFocusTagProcedure](variables/deleteRequirementFocusTagProcedure.md)
- [deleteRequirementProcedure](variables/deleteRequirementProcedure.md)
- [deleteRequirementTypeTagProcedure](variables/deleteRequirementTypeTagProcedure.md)
- [generateRequirementsProcedure](variables/generateRequirementsProcedure.md)
- [getRequirementFocusTagByIdProcedure](variables/getRequirementFocusTagByIdProcedure.md)
- [getRequirementFocusTagsProcedure](variables/getRequirementFocusTagsProcedure.md)
- [getRequirementProcedure](variables/getRequirementProcedure.md)
- [getRequirementsTableFriendlyProcedure](variables/getRequirementsTableFriendlyProcedure.md)
- [getRequirementTypeTagByIdProcedure](variables/getRequirementTypeTagByIdProcedure.md)
- [getRequirementTypeTagsProcedure](variables/getRequirementTypeTagsProcedure.md)
- [modifyRequirementFocusTagProcedure](variables/modifyRequirementFocusTagProcedure.md)
- [modifyRequirementTypeTagProcedure](variables/modifyRequirementTypeTagProcedure.md)
- [requirementsRouter](variables/requirementsRouter.md)

---
sidebar_label: "Settings API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# settings

Settings Router - Tenor API Endpoints for Project Settings Management

This file defines the TRPC router and procedures for managing project settings in the Tenor application.
It provides endpoints to create, read, update, and delete various project configuration options.

The router includes procedures for managing:
- Status types, backlog tags, and priority types
- User roles and permissions
- Scrum settings including sprint durations and story points
- AI context settings including text, links, and files
- Project references and utility functions

Settings are organized under projects and control the behavior and appearance of various
project components throughout the application.

## Variables

- [addFilesProcedure](variables/addFilesProcedure.md)
- [addLinkProcedure](variables/addLinkProcedure.md)
- [addRoleProcedure](variables/addRoleProcedure.md)
- [changeSizeProcedure](variables/changeSizeProcedure.md)
- [createBacklogTagProcedure](variables/createBacklogTagProcedure.md)
- [createRequirementFocusProcedure](variables/createRequirementFocusProcedure.md)
- [createRequirementTypeProcedure](variables/createRequirementTypeProcedure.md)
- [createStatusTypeProcedure](variables/createStatusTypeProcedure.md)
- [default](variables/default.md)
- [deleteBacklogTagProcedure](variables/deleteBacklogTagProcedure.md)
- [deleteStatusTypeProcedure](variables/deleteStatusTypeProcedure.md)
- [fetchDefaultSprintDurationProcedure](variables/fetchDefaultSprintDurationProcedure.md)
- [fetchScrumSettingsProcedure](variables/fetchScrumSettingsProcedure.md)
- [getBacklogTagByIdProcedure](variables/getBacklogTagByIdProcedure.md)
- [getBacklogTagsProcedure](variables/getBacklogTagsProcedure.md)
- [getContextDialogProcedure](variables/getContextDialogProcedure.md)
- [getContextFilesProcedure](variables/getContextFilesProcedure.md)
- [getContextLinksProcedure](variables/getContextLinksProcedure.md)
- [getDetailedRolesProcedure](variables/getDetailedRolesProcedure.md)
- [getMyRoleProcedure](variables/getMyRoleProcedure.md)
- [getPriorityTypesProcedure](variables/getPriorityTypesProcedure.md)
- [getSizeTypesProcedure](variables/getSizeTypesProcedure.md)
- [getStatusTypeByIdProcedure](variables/getStatusTypeByIdProcedure.md)
- [getStatusTypesProcedure](variables/getStatusTypesProcedure.md)
- [getTodoTagProcedure](variables/getTodoTagProcedure.md)
- [modifyBacklogTagProcedure](variables/modifyBacklogTagProcedure.md)
- [modifyStatusTypeProcedure](variables/modifyStatusTypeProcedure.md)
- [removeFileProcedure](variables/removeFileProcedure.md)
- [removeLinkProcedure](variables/removeLinkProcedure.md)
- [removeRoleProcedure](variables/removeRoleProcedure.md)
- [reorderStatusTypesProcedure](variables/reorderStatusTypesProcedure.md)
- [updateControlSprintsProcedure](variables/updateControlSprintsProcedure.md)
- [updateRoleTabPermissionsProcedure](variables/updateRoleTabPermissionsProcedure.md)
- [updateScrumSettingsProcedure](variables/updateScrumSettingsProcedure.md)
- [updateTextContextProcedure](variables/updateTextContextProcedure.md)
- [updateViewPerformanceProcedure](variables/updateViewPerformanceProcedure.md)

## Functions

- [getBacklogTag](functions/getBacklogTag.md)
- [getPriorityTag](functions/getPriorityTag.md)
- [getProjectRef](functions/getProjectRef.md)
- [getProjectRoleRef](functions/getProjectRoleRef.md)
- [getProjectSettingsRef](functions/getProjectSettingsRef.md)
- [getProjectUserRef](functions/getProjectUserRef.md)
- [getTaskProgress](functions/getTaskProgress.md)

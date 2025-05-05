---
sidebar_label: "Issues API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# issues

Issues Router - Tenor API Endpoints for Issue Management

This file defines the TRPC router and procedures for managing issues in the Tenor application.
It provides endpoints to create, read, update, and delete issues within projects.

The router includes procedures for:
- Creating and modifying issues
- Retrieving issue details and table-friendly issue data
- Managing issue tags and related user stories
- Deleting issues (soft delete)
- Getting issue counts

Issues represent bugs, problems, or defects that need to be addressed in a project
and can be related to specific user stories.

## Interfaces

- [IssueCol](interfaces/IssueCol.md)

## Variables

- [createIssueProcedure](variables/createIssueProcedure.md)
- [deleteIssueProcedure](variables/deleteIssueProcedure.md)
- [getIssueCountProcedure](variables/getIssueCountProcedure.md)
- [getIssueDetailProcedure](variables/getIssueDetailProcedure.md)
- [getIssueProcedure](variables/getIssueProcedure.md)
- [getIssuesTableFriendlyProcedure](variables/getIssuesTableFriendlyProcedure.md)
- [issuesRouter](variables/issuesRouter.md)
- [modifyIssueProcedure](variables/modifyIssueProcedure.md)
- [modifyIssuesRelatedUserStoryProcedure](variables/modifyIssuesRelatedUserStoryProcedure.md)
- [modifyIssuesTagsProcedure](variables/modifyIssuesTagsProcedure.md)

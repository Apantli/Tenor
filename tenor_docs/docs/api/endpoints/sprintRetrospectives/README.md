---
sidebar_label: "Sprint Retrospectives API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# sprintRetrospectives

Sprint Retrospective Router - API Endpoints for managing Retrospective records.

This file defines the TRPC router and procedures for retrieving or creating Retrospective entries
associated with sprints. It ensures that a retrospective exists per sprint and returns its ID.

The router includes procedures for:
- Managing sprint retrospective entries and their answers
- Tracking team and individual progress
- Processing happiness ratings and textual feedback
- Generating AI-assisted retrospective summaries

## API

- [sprintRetrospectivesRouter](variables/sprintRetrospectivesRouter.md)

## Other

- [ensureRetrospectivePersonalProgressProcedure](variables/ensureRetrospectivePersonalProgressProcedure.md)
- [ensureRetrospectiveTeamProgressProcedure](variables/ensureRetrospectiveTeamProgressProcedure.md)
- [getPreviousSprintProcedure](variables/getPreviousSprintProcedure.md)
- [getProcessedRetrospectiveAnswersProcedure](variables/getProcessedRetrospectiveAnswersProcedure.md)
- [getRetrospectiveAnswersProcedure](variables/getRetrospectiveAnswersProcedure.md)
- [getRetrospectiveIdProcedure](variables/getRetrospectiveIdProcedure.md)
- [getRetrospectivePersonalProgressProcedure](variables/getRetrospectivePersonalProgressProcedure.md)
- [getRetrospectiveTeamProgressProcedure](variables/getRetrospectiveTeamProgressProcedure.md)
- [saveHappinessProcedure](variables/saveHappinessProcedure.md)
- [saveRetrospectiveAnswersProcedure](variables/saveRetrospectiveAnswersProcedure.md)
- [sendReportProcedure](variables/sendReportProcedure.md)

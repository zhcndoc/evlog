import { defineSchedule } from 'eve/schedules'
import slack from '../channels/slack'
import { maintainerRun } from '../lib/schedule'

export default defineSchedule({
  cron: '0 8 * * 2,5',
  run: maintainerRun(slack, 'Repo health sweep', 'Load the repo-health-sweep skill, read the simplification coverage ledger, choose bounded code, test, architecture, and communication cohorts, then call simplification-sweep once. Read its reviewer health and exact counts before the findings. Reproduce every workflow-confirmed candidate against current main, and call nothing PR-ready before that parent verification passes. Open at most three ready PRs, one per batch of same-kind fixes that clears the full readiness gate, request Hugo as reviewer after CI passes, and record limitations, proposals, questions, rejected findings, and next cohorts in Linear.'),
})

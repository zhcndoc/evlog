import { defineSchedule } from 'eve/schedules'
import slack from '../channels/slack'
import { maintainerRun } from '../lib/schedule'

export default defineSchedule({
  cron: '0 8 1,15 * *',
  run: maintainerRun(slack, 'Adapter alignment', 'Load the adapter-alignment skill, pick the two adapters with the oldest pin in the upstream-alignment reference, and compare each against its provider\'s official client at the current published version. Open ready PRs for mechanical mismatches that clear the full readiness gate, file philosophy mismatches in Linear, move the pins, then request Hugo as reviewer.'),
})

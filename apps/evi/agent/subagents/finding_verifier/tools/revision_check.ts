import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { verifyCheckoutRevision } from '../../../lib/simplification/revision'

export default defineTool({
  description: 'Verify that the shared parent checkout is exactly the expected full commit SHA. Returns the current revision or fails without changing files or Git state.',
  inputSchema: z.object({
    expectedRevision: z.string().regex(/^[a-f0-9]{40}$/),
  }),
  async execute({ expectedRevision }, ctx) {
    return verifyCheckoutRevision(await ctx.getSandbox(), expectedRevision)
  },
})

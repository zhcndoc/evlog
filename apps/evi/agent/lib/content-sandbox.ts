import { defineParentSandbox } from 'eve/sandbox'

/** Both content agents read the parent's branch and uncommitted pages; a clone of main would miss them. */
export default defineParentSandbox()

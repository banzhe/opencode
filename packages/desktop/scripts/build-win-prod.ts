import { $ } from "bun"

process.env.OPENCODE_CHANNEL = "prod"
process.env.GH_TOKEN = ""

await $`bun run prebuild`
await $`bun run build`
await $`bun run package:win`

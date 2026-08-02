# n8n workflows (reference copies)

These files are a version-controlled copy of the workflows deployed in n8n (built with the n8n Workflow SDK). They are documentation/backup — n8n itself runs the live versions, not these files directly.

- `f1-data-sync.ts` — workflow **F1 Data Sync**. Fetches the current F1 season schedule, results, qualifying and standings from the Jolpica (Ergast-compatible) API and upserts them into Supabase. Triggers: manual + weekly (Monday 06:00 UTC).
- `f1-content-idea-generator.ts` — workflow **F1 Content Idea Generator**. Reads the most recently completed races from Supabase and generates ready-to-use Instagram content ideas (podium, fastest lap, comeback, drama, standings) into `content_ideas`. Triggers: manual + daily (08:00 UTC).

To re-apply changes, edit these files, validate with the n8n MCP `validate_workflow` tool, then `update_workflow` with the matching workflow ID.

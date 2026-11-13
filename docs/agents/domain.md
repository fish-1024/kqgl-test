# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root, or
- **`GLOSSARY-MAP.md`** at the repo root if it exists: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

If any of these files do not exist, proceed silently. The domain-modeling skill creates them only when terms or decisions need to be recorded.

## File structure

This is a single-context repository:

```text
/
├── GLOSSARY.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When naming a domain concept, use the term defined in `GLOSSARY.md`. If a needed term is absent, reconsider the terminology or record the gap for domain modeling.

## Flag ADR conflicts

If an output contradicts an existing ADR, surface the conflict explicitly rather than silently overriding it.

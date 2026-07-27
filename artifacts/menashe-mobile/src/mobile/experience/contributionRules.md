# contributionRules.md
### Menashe Experience Language — How MEL Evolves

---

MEL is a living document — but it changes slowly and deliberately.
Stability is a feature. Every unnecessary change to MEL introduces inconsistency
across the screens that already implement it.

---

## Who Can Propose Changes

Anyone on the Menashe Calendar team may **propose** a change to MEL.

Only the **Chief Architect** may **approve** and **merge** a change to MEL.

---

## What Requires a MEL Update

A MEL update is required when:

1. A new interaction pattern is introduced that doesn't exist in [interactionGuide.md](./interactionGuide.md)
2. A new card family is needed that doesn't exist in [cardGuide.md](./cardGuide.md)
3. A new illustration subject category is needed
4. A new platform is being built (adds a section to [futureExperience.md](./futureExperience.md))
5. A spacing rule needs a documented exception
6. A new motion pattern is introduced (new enter/exit for a novel UI element)
7. An accessibility requirement changes (OS API changes, new WCAG standard)
8. A new screen ships with a pattern that wasn't covered by the existing checklist

A MEL update is **not** required when:
- Implementing an existing pattern on a new screen (the pattern is already documented)
- Fixing a bug in a screen's implementation of an existing pattern
- Adding content (new parasha, new holiday) — MEL covers experience, not content
- Updating translations

---

## The Proposal Process

### Step 1 — Problem Statement (1 paragraph)
What is the current experience gap? What MEL section is insufficient?
Write this in plain language — not design jargon.

### Step 2 — Proposed Rule (draft text)
Write the exact text you propose adding or changing in the relevant MEL document.
Use the existing document's structure and tone.

### Step 3 — Justification
Which of the 10 Experience Principles (from [EXPERIENCE_PRINCIPLES.md](./EXPERIENCE_PRINCIPLES.md))
does this change serve? Quote the principle.

If no existing principle covers the change, you may propose a new principle — but this
requires the highest level of scrutiny (see "Changing the Principles" below).

### Step 4 — Impact Assessment
Which existing screens does this change affect?
List them. For each, note whether they need to be updated after the change is approved.

### Step 5 — Chief Architect Review
Submit the proposal as a PR to the MEL documents in `src/mobile/experience/`.
Tag the Chief Architect for review.
The review is a conversation — expect iteration.

---

## Approval Criteria

A MEL change is approved when all of the following are true:

1. **It serves at least one Experience Principle** — explicitly cited.
2. **It creates less work than it prevents** — the new rule should reduce future ambiguity,
   not add bureaucracy to simple decisions.
3. **It is consistent with existing MEL** — it does not contradict any existing rule
   without explicitly superseding and documenting it.
4. **It is specific** — vague rules ("make it feel nice") are never approved.
5. **It has been reviewed on at least one existing screen** before merging — a prototype
   or PR showing the rule applied to a real screen.

---

## Changing the Principles

The 10 Experience Principles in EXPERIENCE_PRINCIPLES.md are the constitution.
They change rarely — maybe once per major version.

To propose a change to a principle:
1. Write a full replacement draft (not just a note or idea).
2. Explain why the current principle is insufficient or incorrect.
3. Identify every current MEL document that references the principle.
4. Show how the replacement principle would have changed a recent real decision.
5. Allow a 2-week comment period before Chief Architect decision.

Principles are never removed — they may be refined or merged.
The count of 10 is not sacred — a principle may be split or combined if the rationale
is compelling.

---

## Versioning

MEL follows a version number in the format `Major.Minor`:

```
1.0   — Initial release (this version)
1.x   — Additive changes: new card families, new interaction patterns, new platform sections
2.0   — Breaking changes: a core principle rewording, a spacing system change,
         a motion system overhaul, or any change that requires all existing screens to be updated
```

When a new version is released:
1. Update the version number in [MEL.md](./MEL.md).
2. Add a `CHANGELOG` section at the bottom of the changed document.
3. Update the experienceChecklist.md "MEL Version" field.
4. For v2.0+: create a migration guide listing every screen affected and what must change.

---

## MEL Changelog

### v1.0 — Initial Release
*Date: July 2026*

Created all 16 MEL documents covering:
- 10 Experience Principles
- Information Hierarchy (typed TypeScript constants)
- 10 Card Families
- Motion Language (10 patterns)
- Illustration Language
- Photography Language
- Typography Usage Rules
- Spacing Language
- Interaction Language (10 interaction types)
- Loading Language (6 states)
- Empty States
- Error Language (4 error classes)
- Accessibility Language (8 categories)
- Future Experience (7 platforms)
- Per-Screen Experience Checklist (12 sections, 60+ checks)
- Contribution Rules

*Chief Architect: Samuel & ChatGPT*
*Implemented by: Replit Agent*

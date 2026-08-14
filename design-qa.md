# TodoDodo design QA

## Target

- Reference: `design-qa-artifacts/reference-1280x618.jpg`
- Implementation: `design-qa-artifacts/search-1280x618-final.png`
- Combined comparison: `design-qa-artifacts/comparison-final.png`
- Matched state: authenticated Search with a populated task list and completed items
- Matched viewport: 1280 × 618

## Visual comparison

The implementation preserves the reference's quiet hierarchy: a fog-colored
navigation rail, a restrained violet selection, a narrow centered work column,
low-contrast borders, compact task rows, and generous surrounding paper. The
intentional differences follow the approved v1 scope: TodoDodo names the actual
search surface (titles and notes), shows task notes, uses the specified 216 px
desktop rail, and exposes only routes that exist or honestly lead to a later-release
placeholder.

Round 1 found no blocking visual mismatch. The final round was repeated after
the auth-recovery, proxy-hardening, and list-race fixes, using the restored
one-completed-task QA dataset so progress, checkbox, strike-through, and sidebar
counts were mutually consistent. The final side-by-side comparison remains close
to the source while using TodoDodo's own content and design tokens.

## Responsive evidence

- Desktop Search, 1280 × 618: `design-qa-artifacts/search-1280x618-final.png`
- Tablet Search, 1024 × 768: `design-qa-artifacts/search-1024x768.png`
- Mobile Search, 390 × 844: `design-qa-artifacts/search-390x844.png`
- Mobile task modal, 390 × 844: `design-qa-artifacts/task-modal-390x844.png`

Desktop uses the full 216 px sidebar, tablet collapses to a 72 px icon rail, and
mobile uses a header plus modal navigation drawer. The task editor becomes a
full-height mobile surface and stays capped at 560 px on desktop.

## Interaction and accessibility checks

- Sign-in and authenticated routing passed against local Supabase.
- Inbox counts, completion state, server-backed Search, note matching, create,
  edit, validation, dirty-close, permanent-delete confirmation, and placeholder
  routes passed in the in-app browser.
- The final regression flow created, searched, completed, and deleted a temporary
  task; the list returned to the original eight-task dataset afterward.
- Search debounce returned the completed task when matching only its notes.
- Modal focus-trap boundaries wrap from the last control to the first and from
  the first control to the last; Escape opens the dirty-discard guard, and a
  second Escape dismisses only that nested guard while keeping the editor open.
- Desktop and mobile checks found no horizontal overflow, unlabeled interactive
  controls, or visible interactive targets smaller than 44 × 44 px.
- Completed state is communicated by checkbox semantics, accessible labels, and
  strike-through rather than color alone.
- Browser console contained no runtime errors during the final flow.

final result: passed

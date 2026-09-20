---
description: "Learn C through a durable AI Tutor conversation and a browser-persisted micro-lesson path in the dsh Apps catalog."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

English | [中文](README.zh.md)

## Summary

This package provides 22 introductory C micro-lessons with an AI Tutor in the Web Apps catalog. Each lesson introduces one concept. The Tutor explains its meaning, syntax, use, and one minimal example; when the learner is ready, it gives one exercise, reviews the answer, summarizes, and can offer an extension. It responds to free-form answers and pasted code. Messages use a dedicated durable DSH Session, while lesson progress persists in the browser. A language-independent course definition lets other languages reuse the dialogue flow with different lessons.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The default Web composition loads the course automatically. Open **Apps**, choose **Learn C**, and start the first lesson. On desktop, the App keeps the course overview and lesson outline in a left column while the Tutor conversation fills the right column; narrow screens stack the same regions. Fenced code examples display line numbers, while copying preserves the original code without the gutter. The App creates a dedicated DSH Session, introduces the current lesson to the Tutor, and keeps subsequent answers, questions, lesson changes, and Tutor responses in that Session. Mark a lesson understood to advance, or select any lesson from the outline.

To mount the package in another browser composition, load it after the Apps shell:

```yaml
- id: app-code-learning
  name: '@deepseek-ai/dsh-client-app-code-learning'
```

The package has no configuration fields. **Start a new learning conversation** clears browser-local course navigation and disconnects the App from its current Tutor Session; the old Session remains available through normal DSH Session history.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The plugin registers one `apps.item` entry with a root-scoped persistent store and injects the Client Session Controller into that entry. The presentation reads a `CourseDefinition` whose lessons carry localization keys, one focus syntax form, a minimal example, and one delayed practice task. It creates a Session with the tool-free `learning` Agent preset, retains it through `sessions.retain()` and `sessions.using()`, projects logged learner and assistant text into the Tutor timeline, and submits prompts through the Session face. Control prompts are logged so model-visible lesson context is reconstructable, while the App hides control and plugin-injected messages from the learner timeline.

The C data is separate from the React flow. Another language adds a course definition and registration while reusing Session ownership, dialogue rendering, navigation, manual completion, and responsive layout.

**Runtime invariant:** No companion is published. Browser-local state contains navigation, manual completion, and the referenced Session id; conversation history remains owned by the Session log. Releasing or resetting the App never deletes its Session.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Apps shell](../ui-apps/README.md) — catalog registration and App presentation modes.
- [Client store](../store/README.md) — root-scoped persistence and action ownership.
- [Web Client Slots](../../../docs/subsystems/slots.md) — component composition and lifecycle.

-----

<a id="model-experience"></a>
## Model Experience

### Tutor lesson control

#### What the model sees

A logged control message marked with `DSH_TUTOR_CONTROL` identifies the programming language, localized course and lesson, lesson goal, focus syntax, earlier concepts, minimal fenced example, and delayed practice task. It directs the model through separate explanation, clarification, practice, feedback, and optional-extension phases. The opening naturally states what the learner will learn and why it is useful, explains only the relevant example lines, and ends by asking whether the learner needs clarification or is ready to practice. The model keeps its teaching strategy invisible: it must not announce concept counts, phases, or pacing rules. It must not introduce a later lesson, expose the exercise before the learner is ready, or claim code execution. The `learning` preset exposes no tools and suppresses runtime workspace context. Lesson changes append the next lesson's grounding to the same Session. Ordinary learner messages enter the Session unchanged.

#### Token effect

The initial turn adds one control message containing the selected lesson's grounding and example. Each lesson change adds another compact control message; ordinary turns add only the learner message and retained Tutor history. The preset adds one short complete persona and no tool schemas, skill catalog, or workspace instructions.

#### KV Cache effect

Each turn uses the complete retained Session context. Lesson changes append a compact control prompt instead of opening another Session, so the provider can reuse the preceding conversation prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No compiler execution** — examples are instructional text; the package does not compile or run learner-authored C code.
- **Browser-local progress** — lesson selection and completion follow the current browser profile; Tutor messages themselves are durable Session data.
- **One course** — the reusable flow currently ships only the 22-micro-lesson C foundations definition.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

# Agent Note: Conversational learning Apps use dedicated Sessions

Status: implemented

English | [中文](2026-09-20-conversational-learning-app-sessions.zh.md)

## Problem

A learning App needs an ongoing teaching conversation rather than a sequence of static questions. Reusing the main Conversation would mix course prompts with the task the user opened DSH to perform, while keeping messages in App state would lose Session durability, streaming, cancellation, and normal history access. Language courses also need to share one interaction model without pretending that learner code was executed.

## Decision

The C learning App creates and retains one dedicated DSH Session with the shipped `learning` Agent preset. That preset contains a complete beginner Tutor persona, suppresses runtime workspace context, and exposes no tools. Its browser store keeps the Session id, lesson selection, and manually confirmed completion state; the Session log owns learner messages, Tutor responses, and model-visible lesson instructions. Resetting the App releases its reference and removes the browser link without deleting the Session.

The App sends a logged control message when the Session starts and when the learner changes lessons. Each lesson grounds one new concept, one focus syntax form, one minimal example, and one delayed practice task. The control separates explanation, clarification, practice, feedback, and optional extension: the Tutor explains only the current concept before asking whether the learner is ready, gives one exercise after confirmation, and does not introduce later lessons as part of the opening. It also prohibits claims of compilation or execution. The learner timeline projects only genuine user-source messages, final assistant text, and live assistant text; marked controls and plugin-injected user-role context stay out of the presentation. Ordinary answers, questions, quick actions, and pasted code use the same Session prompt operation.

Course definitions contain language metadata and lesson grounding, while the dialogue, Session ownership, progress, and rendering flow stay language-independent. A Python or Go App can therefore provide different course data without creating another conversation subsystem.

This decision composes the existing [Apps Slot](../architecture/2026-09-20-scenario-apps-client-slot.md) and [Client Session reference](../architecture/2026-09-15-client-session-references.md) mechanisms. It adds no Apps-specific Host API and no local compiler capability.

## Alternatives considered

**Reuse the main Conversation Session.** Course control messages and learning history would become part of an unrelated task, and closing the App would not identify which view owns the Session reference.

**Store an independent chat transcript in browser state.** This would duplicate Session persistence and streaming semantics, omit normal Session history, and require another recovery and cancellation implementation.

**Use the default coding preset and hide its injected messages.** UI filtering would still send workspace instructions, skill catalogs, and tool schemas to the model. Those inputs waste context, can conflict with the Tutor role, and grant capabilities the learning App does not use.

**Create one Session per lesson.** Lesson boundaries would discard the Tutor's knowledge of the learner's questions and make a short course appear as several unrelated tasks.

**Keep static multiple-choice checks.** Fixed questions cannot adapt explanations, inspect pasted code, or guide the learner through misconceptions, so they do not provide the requested conversational learning experience.

**Compile or execute learner code locally.** Execution requires a separate sandbox, tool, and trust decision. The Tutor reasons about text and states that it did not run the program.

## Consequences

Learning conversations survive App remounts and remain visible through the normal Session system. The App can stop a running response, reconnect a retained Session, and render durable or streaming Markdown without another message store. A learner keeps one conversational context across the course, while lesson completion remains an explicit learner action instead of an inferred model judgment. The dedicated preset keeps coding-agent instructions and capabilities out of the Tutor request and makes the no-execution policy structural rather than prompt-only.

The first lesson requires a configured model provider, and each teaching turn consumes a normal model request. Browser-local course progress can diverge across browser profiles even though the conversation is durable. The Tutor can reason incorrectly about code because no compiler verifies its answer.

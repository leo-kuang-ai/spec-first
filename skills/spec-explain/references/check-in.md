# Check-in

The check-in is the active-recall section of the explainer: a `Check yourself` section at the end of the artifact where the reader answers first and reads the answers after. It is static text in the document. The run asks the reader nothing about it — no offer, no prediction turn, no exercise posed in chat — so a user who switches away never comes back to a waiting question.

## Warrant test — include the section or not

Include a `Check yourself` section when retention is the point: a hard or unfamiliar concept, a gnarly or consequential diff, a dense recap window with decisions worth recalling later. Omit it (produce the explainer and move on) when comprehension is the point and retention is incidental: a routine recap before a meeting, a small mechanical diff, a topic the user signals they only need to skim. When omitting, do not announce a justification — just proceed.

## Section shape

The section carries prompts with visually separated answers, so the reader commits to an answer before the text confirms or corrects it:

- **Predict (diff mode):** "Before reading on — what do you think this change does, and why was it made?" The reader predicts against the raw change reference the artifact already shows; the answer then names the gaps between a likely prediction and what the change actually does.
- **Apply:** a small scenario the concept decides ("given X, what happens / what would you choose?").
- **Explain-back:** the reader restates the core mechanism in their own words; the answer gives the canonical restatement and the one nuance most self-explanations miss.
- **Boundary:** a case where the concept does not apply, or where the naive reading fails.
- **Recap recall (recap mode):** why a notable change in the window was made, or what its consequence was.

Two to four prompts, designed to expose understanding rather than recall of the artifact's phrasing. Answers name the specific gap a wrong answer typically exposes. The section ends the artifact; nothing after it teaches.

# Tasks (27 Nov, until 19:45)

Put your name next to a task before you start it. Keep changes small and push often.

## Must have for the demo
- [x] **Nebius key in `.env`.** Live judge works (Nemotron 3.5 Lightning, thinking off).
- [ ] **idealo sign-in** at `/auth/idealo`, then search for "Laufrad" and check that real products and images appear. _(owner: )_
- [ ] **Rehearse the 3-minute demo** in `docs/DEMO.md` twice. Record a 2-minute backup video. _(owner: )_
- [ ] **Submission:** repo link, video, Nebius note (`docs/PARTNER-NOTES.md`), team names. One captain submits by 19:45. _(owner: )_

## UI polish (the team wants it nicer)
- [ ] Top bar and menus: clearer hierarchy, icons, active states. _(owner: )_
- [ ] Item pop-up: shorter. Put the live research above the fold and collapse the price details. _(owner: )_
- [ ] Timeline view: fewer overlapping cards, and maybe a "list" toggle. _(owner: )_
- [ ] Real product images from idealo (`imageUrl`) in pop-ups and search; 3D models stay for the known item types. _(owner: )_
- [ ] Empty and loading states for live calls. _(owner: )_

## Nice to have
- [ ] Boris (Affinidi): put a gifter role (grandma) in front of the agent tools, with `place_order` hidden. See `docs/PARTNER-NOTES.md`.
- [ ] Save one price snapshot per product per day (`data/prices.jsonl`) to build history beyond 30 days.
- [ ] Stackgini: not planned.

## Done
- [x] 3D home, kids, good-to-buy-now bubbles, add a child
- [x] 12-month timeline per child, price calendar, alerts with "Simulate next day"
- [x] Deal Calendar rules + 8 tests; live Nebius judge endpoint with guardrails
- [x] Live Tavily research table, live EU Safety Gate check
- [x] idealo MCP client with OAuth; agent purchase opens the shop page from the live offer
- [x] Agents tab: live call log

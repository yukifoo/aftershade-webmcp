# WebMCP Challenge — verified requirements

Last verified: 2026-09-04 10:12 JST

Authoritative sources:

- Challenge overview: https://webmcp.devpost.com/
- Official rules: https://webmcp.devpost.com/rules
- Deadline extension: https://webmcp.devpost.com/updates/46227-deadline-extension-12-more-hours
- FAQ and official resources: https://webmcp.devpost.com/resources
- OpenAI Site tools guide: https://learn.chatgpt.com/docs/webmcp
- WebMCP draft specification: https://webmachinelearning.github.io/webmcp/
- Chrome WebMCP guide: https://developer.chrome.com/docs/ai/webmcp

## Deadline and freeze policy

- [x] Current submission deadline verified: **2026-09-04 01:00 PDT / 17:00 JST** (12-hour extension).
- [x] Current time checked: **2026-09-04 10:11 JST**; 6h49m remained.
- [ ] Development freeze by 15:30 JST.
- [ ] All links and submission draft frozen by 16:30 JST.
- [ ] Do not modify the submitted Devpost entry, repository, or live site after the deadline until judging ends on 2026-09-21 17:00 PT.

## Eligibility

- [x] Newly created during the submission period; repository began empty on 2026-09-04.
- [x] Japan is not on the excluded-territory list and is an OpenAI API-supported country.
- [ ] Account holder confirms age of majority, original ownership, and authority to submit.
- [x] No disallowed sponsor-funded pre-existing project is being reused.
- [x] No third-party data or proprietary integrations are required.
- [ ] All submission materials are in English, or have English translations.

## Required product

- [x] Working WebMCP-powered web application (local contract and real-browser flow verified).
- [x] Complete and coherent product experience, not only a proof of concept.
- [x] WebMCP implementation is non-trivial and materially improves the experience.
- [x] Local functionality runs consistently with the prepared video script; production re-check remains gated on deployment.

## Required live access

- [ ] Public working URL over HTTPS.
- [ ] Accessible in ChatGPT's in-app browser.
- [ ] Accessible in Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
- [ ] Free and unrestricted for judges through 2026-09-21 17:00 PT.
- [x] Authentication omitted; no judge credentials needed.

## Required written description

- [x] Why the use case strongly fits WebMCP.
- [x] How it creates a better user experience.
- [x] What people and agents can do together that was previously difficult or impossible.
- [x] Brief WebMCP implementation explanation.
- [ ] Accurate technologies, live URL, repository URL, and video URL.

## Required public repository

- [ ] Public GitHub, GitLab, or Bitbucket URL.
- [x] All source, assets, and instructions needed to run the project are prepared locally.
- [x] `document.modelContext.registerTool(...)` source is plainly visible.
- [x] Open-source `LICENSE` is present locally; hosting detection awaits public repository creation.
- [x] README explains setup, build, architecture, tools, demo, testing, and license.
- [x] No secrets, private data, debug junk, or generated deployment credentials are stored in source.

## Required video

- [ ] **Less than 3:00**; target 2:20–2:40.
- [ ] Publicly visible on YouTube.
- [ ] Clear recording of the real product functioning.
- [ ] Audible narration covers what was built and how WebMCP is used.
- [ ] No unlicensed music, third-party marks, or copyrighted materials.
- [ ] Video URL entered in Devpost.

## Judging criteria

- [ ] WebMCP Leverage — skillful, working, non-trivial implementation.
- [ ] Execution — complete, coherent runnable product.
- [ ] Potential Impact — credible problem and audience supported by the demo.
- [ ] Creativity & Ambition — memorable concept distinct from existing products.

## Platform facts used in implementation

- [x] Use top-level imperative registration; ChatGPT's built-in browser does not currently discover declarative tools or iframe-registered tools.
- [x] Feature-detect `document.modelContext.registerTool` for progressive enhancement.
- [x] Use narrow JSON Schemas, explicit side effects, `readOnlyHint`, bounded outputs, and existing app validation.
- [x] Use `AbortSignal` for tool lifecycle cleanup.
- [x] Keep the human interface fully functional without WebMCP.

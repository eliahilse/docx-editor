---
'@eigenpal/docx-js-editor': patch
---

Extract WPS text-box drawings wrapped in `<mc:AlternateContent>` so floating text boxes from real Word docs (org-chart cards, callouts, etc.) round-trip through the parser instead of being silently dropped.

---
'@eigenpal/docx-js-editor': patch
---

Skip the horizontal exclusion zone for floating images that span the content area (cover photos, banners), so subsequent paragraphs don't wrap every character to its own line. Word renders such images as if they had `topAndBottom` wrap — text flows above and below, not around.

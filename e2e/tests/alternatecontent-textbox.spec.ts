import { test, expect } from '@playwright/test';
import { EditorPage } from '../helpers/editor-page';

/**
 * Regression test for text-box drawings wrapped in <mc:AlternateContent>.
 *
 * The fixture has a single paragraph whose run contains:
 *   <mc:AlternateContent>
 *     <mc:Choice Requires="wps"><w:drawing>...<wps:wsp>"Card Title"</wps:wsp></w:drawing></mc:Choice>
 *     <mc:Fallback><w:pict>VML</w:pict></mc:Fallback>
 *   </mc:AlternateContent>
 *
 * On `main` the parser only walked direct children of <w:r>, so the drawing
 * inside Choice never reached the text-box pipeline and "Card Title" was
 * silently dropped from the rendered page.
 */
const FIXTURE = 'fixtures/alternatecontent-textbox.docx';

test('text-box wrapped in mc:AlternateContent renders its shape content', async ({ page }) => {
  const editor = new EditorPage(page);
  await editor.goto();
  await editor.loadDocxFile(FIXTURE);
  await page.waitForSelector('[data-page-number="1"]');

  const page1 = page.locator('[data-page-number="1"]');

  // The host paragraph's plain text still renders.
  await expect(page1).toContainText('Body paragraph hosting the anchored card.');

  // The text inside the <wps:wsp> reaches the page — this is what the parser
  // fix unlocks. On `main` this assertion times out.
  await expect(page1).toContainText('Card Title');
});

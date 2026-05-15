import { test, expect } from '@playwright/test';
import { EditorPage } from '../helpers/editor-page';

/**
 * Regression test for OOXML section inheritance (ECMA-376 §17.6).
 *
 * The fixture places its w:headerReference / w:footerReference / w:titlePg
 * on an early in-body sectPr and leaves the body-level sectPr free of any
 * header/footer refs. Before the parser learned section inheritance the
 * editor saw no headers because it reads finalSectionProperties only.
 *
 * Mirror the assertions in titlePg-header-footer.spec.ts: page 1 must show
 * the first-page header (logo image) and first-page footer text.
 */
const FIXTURE = 'fixtures/section-inheritance-header-footer.docx';

test.describe('Section property inheritance (header/footer refs + titlePg)', () => {
  test('renders first-page header image on page 1 when refs are on an earlier section', async ({
    page,
  }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForReady();

    await page.locator('input[type="file"][accept=".docx"]').setInputFiles(`e2e/${FIXTURE}`);
    await page.waitForSelector('.paged-editor__pages');
    await page.waitForSelector('[data-page-number="1"]');
    await page.waitForTimeout(1500);

    const page1Header = page.locator('[data-page-number="1"] .layout-page-header');
    const headerImg = page1Header.locator('img');
    await expect(headerImg).toHaveCount(1);
    const imgSrc = await headerImg.getAttribute('src');
    expect(imgSrc).toBeTruthy();
    expect(imgSrc!.startsWith('data:')).toBe(true);
  });

  test('renders first-page footer text on page 1 when refs are on an earlier section', async ({
    page,
  }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForReady();

    await page.locator('input[type="file"][accept=".docx"]').setInputFiles(`e2e/${FIXTURE}`);
    await page.waitForSelector('.paged-editor__pages');
    await page.waitForSelector('[data-page-number="1"]');
    await page.waitForTimeout(1500);

    const page1Footer = page.locator('[data-page-number="1"] .layout-page-footer');
    const footerText = await page1Footer.textContent();
    expect(footerText).toContain('Some address');
    expect(footerText).toContain('phone');
    expect(footerText).toContain('website');
  });

  test('does not show default header text on page 1 (titlePg is inherited)', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForReady();

    await page.locator('input[type="file"][accept=".docx"]').setInputFiles(`e2e/${FIXTURE}`);
    await page.waitForSelector('.paged-editor__pages');
    await page.waitForSelector('[data-page-number="1"]');
    await page.waitForTimeout(1500);

    const page1Header = page.locator('[data-page-number="1"] .layout-page-header');
    const headerText = await page1Header.textContent();
    expect(headerText).not.toContain('Second header onwards');
  });
});

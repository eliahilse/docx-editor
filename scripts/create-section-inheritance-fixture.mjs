/**
 * Build a DOCX fixture exercising OOXML section inheritance for header/footer
 * references and titlePg.
 *
 * Derived from titlePg-header-footer.docx by moving the header/footer refs and
 * titlePg from the body-level sectPr onto an in-body paragraph sectPr that
 * sits at the start of the document. The body-level sectPr keeps only page
 * setup (pgSz, pgMar, cols). Per ECMA-376 17.6, later sections inherit
 * header/footer refs by type and titlePg from earlier sections when omitted.
 *
 * Expected behavior after the inheritance fix: page 1 still shows the
 * first-page header (logo) and first-page footer (address text), pages 2+
 * still show the default header content, just as the unmodified fixture
 * does. Without the fix, no header/footer renders because the body-level
 * sectPr has no refs.
 */

import JSZip from 'jszip';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'e2e/fixtures/titlePg-header-footer.docx');
const OUT = path.join(ROOT, 'e2e/fixtures/section-inheritance-header-footer.docx');

const HEADER_FOOTER_REFS =
  '<w:headerReference w:type="default" r:id="rId8"/>' +
  '<w:headerReference w:type="even" r:id="rId9"/>' +
  '<w:headerReference w:type="first" r:id="rId10"/>' +
  '<w:footerReference w:type="default" r:id="rId11"/>' +
  '<w:footerReference w:type="even" r:id="rId12"/>' +
  '<w:footerReference w:type="first" r:id="rId13"/>';

const BODY_SECT_PR_WITH_REFS_RE =
  /<w:sectPr>(?:(?!<\/w:sectPr>).)*<\/w:sectPr>(?=<\/w:body>)/;

function buildFixture(documentXml) {
  const match = documentXml.match(BODY_SECT_PR_WITH_REFS_RE);
  if (!match) {
    throw new Error('Could not locate body-level <w:sectPr> in source document.xml');
  }
  const bodySectPr = match[0];

  if (!bodySectPr.includes('w:headerReference')) {
    throw new Error('Source body sectPr has no header references; nothing to move');
  }
  if (!bodySectPr.includes('<w:titlePg/>')) {
    throw new Error('Source body sectPr has no <w:titlePg/>; expected for this fixture');
  }

  const earlySectPr =
    '<w:sectPr>' +
    HEADER_FOOTER_REFS +
    '<w:type w:val="continuous"/>' +
    '<w:titlePg/>' +
    '</w:sectPr>';

  const earlyParagraph =
    '<w:p w14:paraId="11111111"><w:pPr>' +
    earlySectPr +
    '</w:pPr></w:p>';

  const strippedBodySectPr = bodySectPr
    .replace(/<w:headerReference[^/]*\/>/g, '')
    .replace(/<w:footerReference[^/]*\/>/g, '')
    .replace('<w:titlePg/>', '');

  const withEarlyParagraph = documentXml.replace(
    '<w:body>',
    '<w:body>' + earlyParagraph
  );
  return withEarlyParagraph.replace(bodySectPr, strippedBodySectPr);
}

async function main() {
  const sourceBuf = fs.readFileSync(SOURCE);
  const zip = await JSZip.loadAsync(sourceBuf);
  const documentEntry = zip.file('word/document.xml');
  if (!documentEntry) throw new Error('source docx has no word/document.xml');

  const originalXml = await documentEntry.async('string');
  const patchedXml = buildFixture(originalXml);
  zip.file('word/document.xml', patchedXml);

  const out = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(OUT, out);
  console.log('Wrote', path.relative(ROOT, OUT), '(', out.length, 'bytes)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

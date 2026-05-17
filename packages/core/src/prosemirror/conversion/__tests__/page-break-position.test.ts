/**
 * Regression — `<w:br type="page"/>` position within a paragraph decides
 * whether the synthetic `pageBreak` node is emitted BEFORE or AFTER the
 * paragraph (ECMA-376 §17.3.3.1).
 *
 *   - Leading break (no visible content before it) → next page hosts the
 *     paragraph's text. Word's "chapter heading" pattern:
 *     `<w:r><w:br type="page"/></w:r><w:r><w:t>Heading</w:t></w:r>`. Always
 *     emitting AFTER renders the heading at the bottom of the prior page
 *     and the next content at the top of the new page — visually identical
 *     to a blank tail on the prior page (parity-doc Revision History bug).
 *   - Trailing break → next paragraph starts a new page.
 *   - Break-only paragraph → equivalent to a trailing break (no visible
 *     content to render either way).
 */

import { describe, test, expect } from 'bun:test';
import { toProseDoc } from '../toProseDoc';
import type { Document, Paragraph } from '../../../types/document';

function makeDoc(content: Document['package']['document']['content']): Document {
  return { package: { document: { content } } };
}

function topLevelKinds(pm: ReturnType<typeof toProseDoc>): string[] {
  const out: string[] = [];
  pm.forEach((node) => {
    out.push(node.type.name);
  });
  return out;
}

describe('toProseDoc — page break position within a paragraph', () => {
  test('leading break (break run before text run) emits pageBreak BEFORE the paragraph', () => {
    const para: Paragraph = {
      type: 'paragraph',
      content: [
        { type: 'run', content: [{ type: 'break', breakType: 'page' }] },
        { type: 'run', content: [{ type: 'text', text: 'Revision History' }] },
      ],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['pageBreak', 'paragraph']);
  });

  test('trailing break (text run before break run) emits pageBreak AFTER the paragraph', () => {
    const para: Paragraph = {
      type: 'paragraph',
      content: [
        { type: 'run', content: [{ type: 'text', text: 'End of section' }] },
        { type: 'run', content: [{ type: 'break', breakType: 'page' }] },
      ],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['paragraph', 'pageBreak']);
  });

  test('break-only paragraph (no visible content) emits pageBreak BEFORE the empty paragraph', () => {
    const para: Paragraph = {
      type: 'paragraph',
      content: [{ type: 'run', content: [{ type: 'break', breakType: 'page' }] }],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['pageBreak', 'paragraph']);
  });

  test('no page break: no pageBreak sibling emitted', () => {
    const para: Paragraph = {
      type: 'paragraph',
      content: [{ type: 'run', content: [{ type: 'text', text: 'Plain text' }] }],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['paragraph']);
  });

  test('break inside a hyperlink-wrapped run is detected and positioned', () => {
    // Leading break carried by the first hyperlink child run — still emits
    // BEFORE the paragraph because no visible content precedes it.
    const para: Paragraph = {
      type: 'paragraph',
      content: [
        {
          type: 'hyperlink',
          anchor: '_Toc1',
          children: [
            { type: 'run', content: [{ type: 'break', breakType: 'page' }] },
            { type: 'run', content: [{ type: 'text', text: 'Chapter' }] },
          ],
        },
      ],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['pageBreak', 'paragraph']);
  });

  test('empty (zero-length) text run before a break does not flip the position', () => {
    // Word frequently emits a styled but empty run before the break run
    // (carries paragraph-mark formatting); it produces no glyphs and must
    // not count as "visible content".
    const para: Paragraph = {
      type: 'paragraph',
      content: [
        { type: 'run', content: [{ type: 'text', text: '' }] },
        { type: 'run', content: [{ type: 'break', breakType: 'page' }] },
        { type: 'run', content: [{ type: 'text', text: 'Revision History' }] },
      ],
    };
    const pm = toProseDoc(makeDoc([para]));
    expect(topLevelKinds(pm)).toEqual(['pageBreak', 'paragraph']);
  });
});

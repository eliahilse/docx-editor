import { describe, test, expect } from 'bun:test';
import { applySectionInheritance } from '../sectionParser';
import type { Section, SectionProperties } from '../../types/document';

function makeProps(p: Partial<SectionProperties> = {}): SectionProperties {
  return {
    pageWidth: 12240,
    pageHeight: 15840,
    orientation: 'portrait',
    ...p,
  };
}

function makeSection(props: Partial<SectionProperties>): Section {
  return { properties: makeProps(props), content: [] };
}

describe('applySectionInheritance', () => {
  test('returns input untouched when fewer than 2 sections', () => {
    const single = [makeSection({ headerReferences: [{ type: 'default', rId: 'rId8' }] })];
    expect(applySectionInheritance(single)).toBe(single);
    expect(applySectionInheritance([])).toEqual([]);
  });

  test('inherits header references by type into a section that has none', () => {
    const sections = [
      makeSection({
        headerReferences: [
          { type: 'default', rId: 'rId8' },
          { type: 'first', rId: 'rId10' },
        ],
      }),
      makeSection({}),
    ];
    const result = applySectionInheritance(sections);
    expect(result[1].properties.headerReferences).toEqual([
      { type: 'default', rId: 'rId8' },
      { type: 'first', rId: 'rId10' },
    ]);
  });

  test('own refs override prior refs of the same type, missing types still inherit', () => {
    const sections = [
      makeSection({
        headerReferences: [
          { type: 'default', rId: 'rId8' },
          { type: 'first', rId: 'rId10' },
        ],
      }),
      makeSection({
        headerReferences: [{ type: 'default', rId: 'rId99' }],
      }),
    ];
    const result = applySectionInheritance(sections);
    expect(result[1].properties.headerReferences).toEqual([
      { type: 'default', rId: 'rId99' },
      { type: 'first', rId: 'rId10' },
    ]);
  });

  test('inherits footer references by type', () => {
    const sections = [
      makeSection({ footerReferences: [{ type: 'default', rId: 'rId11' }] }),
      makeSection({}),
    ];
    const result = applySectionInheritance(sections);
    expect(result[1].properties.footerReferences).toEqual([{ type: 'default', rId: 'rId11' }]);
  });

  test('inherits titlePg when omitted, preserves own value when set', () => {
    const sections = [
      makeSection({ titlePg: true }),
      makeSection({}),
      makeSection({ titlePg: false }),
    ];
    const result = applySectionInheritance(sections);
    expect(result[1].properties.titlePg).toBe(true);
    expect(result[2].properties.titlePg).toBe(false);
  });

  test('inheritance is transitive across consecutive sections', () => {
    const sections = [
      makeSection({
        headerReferences: [{ type: 'default', rId: 'rId8' }],
        titlePg: true,
      }),
      makeSection({}),
      makeSection({}),
    ];
    const result = applySectionInheritance(sections);
    expect(result[2].properties.headerReferences).toEqual([{ type: 'default', rId: 'rId8' }]);
    expect(result[2].properties.titlePg).toBe(true);
  });

  test('does not mutate input sections', () => {
    const first = makeSection({ headerReferences: [{ type: 'default', rId: 'rId8' }] });
    const second = makeSection({});
    const sections = [first, second];
    applySectionInheritance(sections);
    expect(second.properties.headerReferences).toBeUndefined();
  });

  test('does not touch unrelated section properties', () => {
    const sections = [
      makeSection({
        headerReferences: [{ type: 'default', rId: 'rId8' }],
        marginTop: 1440,
      }),
      makeSection({ marginTop: 720 }),
    ];
    const result = applySectionInheritance(sections);
    expect(result[1].properties.marginTop).toBe(720);
  });
});

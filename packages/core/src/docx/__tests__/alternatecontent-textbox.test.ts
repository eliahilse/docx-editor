/**
 * Regression — text-box drawings wrapped in mc:AlternateContent.
 *
 * Word emits anchored WPS text boxes (the cards used for org charts,
 * pull-quote callouts, etc.) inside an mc:AlternateContent block:
 *   mc:Choice Requires="wps" holds the modern wps:wsp shape, and
 *   mc:Fallback holds a VML rendering for legacy consumers.
 *
 * enrichParagraphTextBoxes used to walk only the direct children of
 * <w:r>, so the <w:drawing> inside the Choice branch never reached the
 * text-box pipeline and the shape's text was silently dropped on parse.
 */

import { describe, expect, test } from 'bun:test';
import { parseDocumentBody } from '../documentParser';

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"';

function buildDocumentWithAlternateContentTextBox(roleName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document ${NS}>
      <w:body>
        <w:p>
          <w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wps">
                <w:drawing>
                  <wp:anchor distT="45720" distB="45720" distL="114300" distR="114300"
                    simplePos="0" relativeHeight="251695104" behindDoc="0" locked="0"
                    layoutInCell="1" allowOverlap="1">
                    <wp:simplePos x="0" y="0"/>
                    <wp:positionH relativeFrom="margin">
                      <wp:align>right</wp:align>
                    </wp:positionH>
                    <wp:positionV relativeFrom="paragraph">
                      <wp:posOffset>0</wp:posOffset>
                    </wp:positionV>
                    <wp:extent cx="1390650" cy="278130"/>
                    <wp:effectExtent l="0" t="0" r="0" b="0"/>
                    <wp:wrapSquare wrapText="bothSides"/>
                    <wp:docPr id="1" name="Text Box 1"/>
                    <wp:cNvGraphicFramePr/>
                    <a:graphic>
                      <a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
                        <wps:wsp>
                          <wps:cNvSpPr txBox="1"/>
                          <wps:spPr>
                            <a:xfrm>
                              <a:off x="0" y="0"/>
                              <a:ext cx="1390650" cy="278130"/>
                            </a:xfrm>
                            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                          </wps:spPr>
                          <wps:txbx>
                            <w:txbxContent>
                              <w:p>
                                <w:r>
                                  <w:t>${roleName}</w:t>
                                </w:r>
                              </w:p>
                            </w:txbxContent>
                          </wps:txbx>
                          <wps:bodyPr/>
                        </wps:wsp>
                      </a:graphicData>
                    </a:graphic>
                  </wp:anchor>
                </w:drawing>
              </mc:Choice>
              <mc:Fallback>
                <w:pict/>
              </mc:Fallback>
            </mc:AlternateContent>
          </w:r>
        </w:p>
      </w:body>
    </w:document>`;
}

describe('enrichParagraphTextBoxes — mc:AlternateContent traversal', () => {
  test('extracts a wps:wsp text box wrapped in mc:Choice', () => {
    const body = parseDocumentBody(buildDocumentWithAlternateContentTextBox('Operations Manager'));
    expect(body.content).toHaveLength(1);
    const paragraph = body.content[0];
    expect(paragraph.type).toBe('paragraph');
    if (paragraph.type !== 'paragraph') return;

    // Walk the parsed runs and find any ShapeContent — should have exactly one
    const shapes = paragraph.content.flatMap((c) =>
      c.type === 'run' ? c.content.filter((rc) => rc.type === 'shape') : []
    );
    expect(shapes).toHaveLength(1);
    const shape = shapes[0];
    if (shape.type !== 'shape') return;

    expect(shape.shape.textBody?.content).toBeDefined();
    expect(shape.shape.textBody!.content).toHaveLength(1);
    const innerPara = shape.shape.textBody!.content[0];
    if (innerPara.type !== 'paragraph') throw new Error('expected paragraph');
    const innerRun = innerPara.content[0];
    if (innerRun.type !== 'run') throw new Error('expected run');
    const innerText = innerRun.content[0];
    if (innerText.type !== 'text') throw new Error('expected text');
    expect(innerText.text).toBe('Operations Manager');
  });
});

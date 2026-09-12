import { describe, it, expect } from 'vitest';
import { buildTooltipHTML } from '../../src/utils/buildTooltipHTML';

const base = {
  title: 'Why I Built This Site',
  description: 'Reclaiming my words.',
  favicon: '/favicon.ico',
  displayUrl: 'ruwaizrazak.com',
  isExternal: false,
};

describe('buildTooltipHTML', () => {
  it('returns an empty string when there is nothing to show', () => {
    expect(buildTooltipHTML({ ...base, title: null, description: null })).toBe('');
  });

  it('renders a header when a title is present', () => {
    const html = buildTooltipHTML(base);
    expect(html).toContain('link-tooltip-header');
    expect(html).toContain('Why I Built This Site');
  });

  it('omits the header when there is no title but keeps the description', () => {
    const html = buildTooltipHTML({ ...base, title: null });
    expect(html).not.toContain('link-tooltip-header');
    expect(html).toContain('link-tooltip-description');
  });

  it('always renders the footer with favicon and display URL', () => {
    const html = buildTooltipHTML(base);
    expect(html).toContain('src="/favicon.ico"');
    expect(html).toContain('ruwaizrazak.com');
  });

  it('uses the outward arrow for external links and the chevron for internal', () => {
    const external = buildTooltipHTML({ ...base, isExternal: true });
    const internal = buildTooltipHTML({ ...base, isExternal: false });
    expect(external).toContain('<polyline points="7 7 17 7 17 17">');
    expect(internal).toContain('M15 18l-6-6 6-6');
    expect(internal).not.toContain('<polyline');
  });

  it('produces one balanced wrapper element', () => {
    const html = buildTooltipHTML(base);
    expect(html.startsWith('<div class="link-tooltip">')).toBe(true);
    expect(html.endsWith('</div>')).toBe(true);
  });
});

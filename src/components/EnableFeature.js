// src/components/EnableFeature.js
//
// Shortcode for "this feature sits behind a feature gate". Feature pages use it
// instead of repeating the enablement steps, which live once on the Hub docs
// page howtos/enable-features.md.
//
//     import EnableFeature from '@site/src/components/EnableFeature';
//
//     <EnableFeature gate="Registry" anchor="catalog-and-registry">
//       Catalog uses the credentials it holds, so enable Catalog alongside it.
//     </EnableFeature>
//
// Props:
//   gate     the gate's name, as it appears in Helm values
//   anchor   optional heading on the enablement page to deep-link to
//   href     optional override for the enablement page itself
//   children optional sentence naming what else the gate needs
import React from 'react';
import Admonition from '@theme/Admonition';
import Link from '@docusaurus/Link';

const ENABLEMENT_PAGE = '/hub/howtos/enable-features';

export default function EnableFeature({ gate, anchor, href, children }) {
  const target = `${href ?? ENABLEMENT_PAGE}${anchor ? `#${anchor}` : ''}`;
  return (
    <Admonition type="info">
      <p>
        <code>{gate}</code> is off by default. Add it to your Helm values and
        upgrade the release: see{' '}
        <Link to={target}>Enable optional features</Link>.{children ? ' ' : ''}
        {children}
      </p>
    </Admonition>
  );
}

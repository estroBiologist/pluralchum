const React = BdApi.React;

const markupClass = BdApi.Webpack.getByKeys('markup')?.markup;
const textClass = BdApi.Webpack.getByKeys('text-sm/normal')['text-sm/normal'];
const thinClass = BdApi.Webpack.getByKeys('scrollerBase', 'thin')?.thin;

import Bio from './Bio';

export default function DataPanelBio({ content }) {
  const scrollerClass = BdApi.Webpack.getByKeys('scroller', 'note')?.scroller;

  return (
    <div className={`${scrollerClass} ${thinClass}`} style={{ overflow: 'hidden scroll', paddingRight: '8px' }}>
      <div className={markupClass}>
        <div className={textClass}>
          <Bio content={content} />
        </div>
      </div>
    </div>
  );
}

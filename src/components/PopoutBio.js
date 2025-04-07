import Bio from './Bio';

const React = BdApi.React;
const markupClass = BdApi.Webpack.getByKeys('markup')?.markup;
const textClass = BdApi.Webpack.getByKeys('text-sm/normal')['text-sm/normal'];
const thinClass = BdApi.Webpack.getByKeys('scrollerBase', 'thin')?.thin;

export default function PopoutBio({ content }) {
  return (
    <div className={thinClass} style={{ overflow: 'hidden scroll', 'max-height': '30vh' }}>
      <div className={markupClass}>
        <div className={textClass}>
          <Bio content={content} />
        </div>
      </div>
    </div>
  );
}

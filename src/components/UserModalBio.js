import Bio from './Bio';

const React = BdApi.React;

const markupClass = BdApi.Webpack.getByKeys('markup')?.markup;
const textClass = BdApi.Webpack.getByKeys('text-sm/normal')['text-sm/normal'];
const scrollerBaseClasses = BdApi.Webpack.getByKeys('scrollerBase', 'disableScrollAnchor');
const scrollerClasses = BdApi.Webpack.getByKeys('scroller', 'note');
const classes = {
  markup: markupClass ?? 'markup__75297',
  text: textClass ?? 'text-sm/normal_cf4812',
  thin: scrollerBaseClasses?.thin ?? 'thin_d125d2',
  scroller: scrollerClasses?.scroller ?? 'scroller_fcb628',
  scrollerBase: scrollerBaseClasses?.scrollerBase ?? 'scrollerBase_d125d2',
};

export default function UserModalBio({ content }) {
  return (
    <div
      className={`${classes.scroller} ${classes.thin} ${classes.scrollerBase}`}
      style={{ overflow: 'hidden scroll', paddingRight: '8px' }}
    >
      <div className={classes.markup}>
        <div className={classes.text}>
          <Bio content={content} />
        </div>
      </div>
    </div>
  );
}

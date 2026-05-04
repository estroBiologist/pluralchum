// The MIT License (MIT)

// **Original Work** Copyright (c) 2014 Sam Herbert

// **Modified Work Copyright (c) 2018 Adam Wanninger**

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Animated three dot loader
const ThreeDots = ({ className, ...props }) => (
  <svg
    width={120}
    height={30}
    fill='#fff'
    viewBox='0 0 120 30'
    className={`svg-loaders-svg${className ? ` ${className}` : ''}`}
    {...props}
  >
    <circle cx={15} cy={15} r={15}>
      <animate
        attributeName='r'
        from={15}
        to={15}
        begin='0s'
        dur='0.8s'
        values='15;9;15'
        calcMode='linear'
        repeatCount='indefinite'
      />
      <animate
        attributeName='fill-opacity'
        from={1}
        to={1}
        begin='0s'
        dur='0.8s'
        values='1;.5;1'
        calcMode='linear'
        repeatCount='indefinite'
      />
    </circle>
    <circle cx={60} cy={15} r={9} fillOpacity={0.3}>
      <animate
        attributeName='r'
        from={9}
        to={9}
        begin='0s'
        dur='0.8s'
        values='9;15;9'
        calcMode='linear'
        repeatCount='indefinite'
      />
      <animate
        attributeName='fill-opacity'
        from={0.5}
        to={0.5}
        begin='0s'
        dur='0.8s'
        values='.5;1;.5'
        calcMode='linear'
        repeatCount='indefinite'
      />
    </circle>
    <circle cx={105} cy={15} r={15}>
      <animate
        attributeName='r'
        from={15}
        to={15}
        begin='0s'
        dur='0.8s'
        values='15;9;15'
        calcMode='linear'
        repeatCount='indefinite'
      />
      <animate
        attributeName='fill-opacity'
        from={1}
        to={1}
        begin='0s'
        dur='0.8s'
        values='1;.5;1'
        calcMode='linear'
        repeatCount='indefinite'
      />
    </circle>
  </svg>
);

export { ThreeDots };

import remarkToc from 'remark-toc';
import remarkValidateLinks from 'remark-validate-links';
import remarkCollapse from 'remark-collapse';

export default {
  plugins: [
    [remarkToc, { heading: 'Index', maxDepth: 4 }],
    remarkValidateLinks,
    [remarkCollapse, { test: 'Index', summary: 'Click to expand' }],
  ],
};

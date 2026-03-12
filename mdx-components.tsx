import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="mdx-title" {...props} />,
    p: (props) => <p className="mdx-copy" {...props} />,
    ul: (props) => <ul className="mdx-list" {...props} />,
    ...components
  };
}

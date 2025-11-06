import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const base = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx']
};

const withMDX = createMDX({});

export default withMDX(base);



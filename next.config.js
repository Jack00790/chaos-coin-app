/**
 * @type {import('next').NextConfig}
 *
 * The configuration file for Next.js.  We enable React strict mode to catch
 * potential issues during development and leave other settings at their
 * defaults.  You can extend this file to customize webpack, add redirects,
 * configure internationalization or enable experimental features.
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
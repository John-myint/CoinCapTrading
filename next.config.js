/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.config.ts');

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);

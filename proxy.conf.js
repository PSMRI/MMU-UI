// Dev-only proxy: routes /<service>-api calls from the local UI to the DEV backend
// (mentor: use DEV for development). Rewrites Origin/Referer to the backend host so its
// security layer treats the request as same-origin (a localhost Origin gets rejected with 403).
const TARGET = 'https://amritwprdev.piramalswasthya.org';

const onProxyReq = (proxyReq) => {
  proxyReq.setHeader('origin', TARGET);
  proxyReq.setHeader('referer', TARGET + '/');
};

module.exports = [
  {
    context: [
      '/common-api',
      '/mmu-api',
      '/admin-api',
      '/tm-api',
      '/scheduler-api',
      '/fhir-api',
      '/identity-api',
      '/aam-inventory',
    ],
    target: TARGET,
    secure: true,
    changeOrigin: true,
    onProxyReq,
  },
];

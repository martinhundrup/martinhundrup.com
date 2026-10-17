// Assets-only Worker. The build script writes cf's v0 Build Output so the
// site keeps its existing buildless source and local preview workflow.
export default {
  accountId: '68555cfc43ca5a5579ad49a3e7060711',
  worker: {
    name: 'martin-hundrup',
    compatibilityDate: '2026-10-16',
    workersDev: false,
    assets: { htmlHandling: 'auto-trailing-slash', notFoundHandling: 'none' },
    // Bonsai's existing /bonsai and /bonsai/* routes are more specific.
    triggers: [{ type: 'fetch', pattern: 'martinhundrup.com/*', zone: 'martinhundrup.com' }],
    observability: {
      enabled: true,
      headSamplingRate: 0.1,
      traces: { enabled: true, headSamplingRate: 0.1 },
    },
  },
};

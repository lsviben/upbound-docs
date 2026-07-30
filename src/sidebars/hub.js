module.exports = {
  sidebar: [
    {
      type: 'doc',
      id: 'overview/index',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'hub-quickstart',
      label: 'Try the hub',
    },
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'concepts/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Insights',
      link: { type: 'doc', id: 'insights/overview' },
      items: [
        'insights/query',
        'insights/definitions',
        'insights/packages',
        {
          type: 'category',
          label: 'Catalog',
          link: { type: 'doc', id: 'insights/catalog/overview' },
          customProps: { badge: 'Preview' },
          items: [
            'insights/catalog/console',
          ],
        },
        {
          type: 'category',
          label: 'Lenses',
          link: { type: 'doc', id: 'insights/lenses/overview' },
          items: [
            'insights/lenses/console',
          ],
        },
        // {
        //   type: 'category',
        //   label: 'Agent sessions',
        //   link: { type: 'doc', id: 'insights/agent-sessions/overview' },
        //   customProps: { badge: 'Preview' },
        //   items: [
        //     'insights/agent-sessions/troubleshooting-session',
        //   ],
        // },
        {
          type: 'doc',
          id: 'insights/metrics/overview',
          label: 'Metrics',
          customProps: { badge: 'Preview' },
        },
        {
          type: 'doc',
          id: 'insights/registry/overview',
          label: 'Registry',
          customProps: { badge: 'Preview' },
        },
        {
          type: 'category',
          label: 'Resource filtering',
          link: { type: 'doc', id: 'insights/resource-filtering/overview' },
          customProps: { badge: 'Preview' },
          items: [
            'insights/resource-filtering/filtering-resources',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Deploy',
      items: [
        'howtos/prerequisites',
        'howtos/oidc-configuration',
        {
          type: 'category',
          label: 'Databases',
          link: { type: 'doc', id: 'howtos/databases/overview' },
          items: [
            'howtos/databases/aws-rds',
          ],
        },
        'howtos/install',
        'howtos/metrics',
      ],
    },
    {
      type: 'category',
      label: 'Production',
      link: { type: 'doc', id: 'howtos/production-overview' },
      items: [
        'howtos/sizing',
        'howtos/high-availability',
        'howtos/autoscaling',
        'howtos/rbac',
        'howtos/connect-control-plane',
        'howtos/connect-space',
        'howtos/upgrades',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      link: { type: 'doc', id: 'reference/index' },
      items: [
        'reference/feature-flags',
        'reference/feature-releases',
      ],
    },
  ],
};

module.exports = {
  sidebar: [
    {
      type: "doc",
      id: "overview/index",
      label: "Overview",
    },
    {
      type: "category",
      label: "Concepts",
      items: ["concepts/architecture"],
    },
    {
      type: "category",
      label: "Insights",
      items: [
        {
          type: "category",
          label: "Catalog",
          link: { type: "doc", id: "insights/catalog/overview" },
          customProps: { badge: "Preview" },
          items: [
            "insights/catalog/configuration",
            "insights/catalog/external-registry",
            "insights/catalog/console",
          ],
        },
        {
          type: "category",
          label: "Lenses",
          link: { type: "doc", id: "insights/lenses/overview" },
          items: ["insights/lenses/console"],
        },
      ],
    },
    {
      type: "category",
      label: "Deploy",
      items: [
        "howtos/prerequisites",
        "howtos/oidc-configuration",
        {
          type: "category",
          label: "Databases",
          link: { type: "doc", id: "howtos/databases/overview" },
          items: ["howtos/databases/aws-rds"],
        },
        "howtos/install",
        "howtos/connect-control-plane",
        "howtos/connect-space",
      ],
    },
    {
      type: "category",
      label: "Production",
      link: { type: "doc", id: "howtos/production-overview" },
      items: [
        "howtos/sizing",
        "howtos/high-availability",
        "howtos/autoscaling",
        "howtos/rbac",
        "howtos/upgrades",
      ],
    },
    {
      type: "category",
      label: "Reference",
      link: { type: "doc", id: "reference/index" },
      items: ["reference/feature-flags", "reference/feature-releases"],
    },
  ],
};

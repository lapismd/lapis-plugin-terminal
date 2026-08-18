import {
  defineConfig,
  singleIdVerification,
  tableRequirements,
} from "@lapismd/spec-validator";

export default defineConfig(tableRequirements(), {
  name: "lapis-plugin-terminal",
  idPattern: /^(?:LPT|LPT-SPEC)-\d{3}$/,
  ruleIds: {
    summary: "LPT-SPEC-001",
    governance: "LPT-SPEC-003",
    verification: "LPT-SPEC-003",
    book: "LPT-SPEC-001",
    bookIgnore: "LPT-SPEC-001",
    packageManifest: "LPT-001",
    specFirst: "LPT-SPEC-002",
    internal: "LPT-SPEC-003",
  },
  diagnostics: {
    "SPEC-PKG-PORTABLE": "LPT-SPEC-004",
    "SPEC-PKG-MANIFEST-MISSING": "LPT-001",
    "SPEC-PKG-MANIFEST": "LPT-001",
  },
  validators: {
    summary: true,
    governance: {
      acceptance: false,
      normative: true,
      proseLimits: false,
      references: true,
      changeMap: false,
    },
    verification: singleIdVerification({
      headers: {
        ids: ["ID"],
        status: ["Status"],
        evidence: ["Evidence"],
        required: [],
      },
      statuses: ["Implemented", "Planned", "Visual pending"],
    }),
    book: true,
    packageManifest: {
      name: "@lapis-notes/lapis-plugin-terminal",
      version: "0.1.0",
      privateAllowed: false,
      portableDependencies: true,
      manifestPath: "manifest.json",
      manifest: {
        id: "terminal",
        distribution: "first-party-external",
        provenance: "official",
        enabledByDefault: true,
      },
    },
    specFirst: {
      mode: "mapped",
      canonicalPattern:
        "^spec/src/(?:plugins/(?:index|terminal)|spec-governance)\\.md$",
      ignore: [
        "(^|/)node_modules/",
        "(^|/)(?:dist|build|storybook-static)/",
        "^spec/book/",
        "^spec/src/(?:SUMMARY|verification)\\.md$",
        "\\.(?:spec|test)\\.[cm]?[jt]sx?$",
      ],
      rules: [
        {
          pattern: "^(?:package\\.json$|manifest\\.json$|src/)",
          chapters: ["spec/src/plugins/terminal.md"],
        },
        {
          pattern:
            "^(?:pnpm-|scripts/|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
          chapters: ["spec/src/spec-governance.md"],
        },
      ],
      protected: [
        "^(?:package\\.json$|manifest\\.json$|src/|pnpm-|scripts/|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
      ],
    },
  },
});

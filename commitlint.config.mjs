export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "test", "refactor", "chore", "docs", "perf", "ci"]],
    "subject-case": [2, "always", "lower-case"],
    "subject-max-length": [2, "always", 50],
    "body-max-line-length": [2, "always", 72],
  },
};

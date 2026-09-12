/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    "no-console": "warn",
  },
};

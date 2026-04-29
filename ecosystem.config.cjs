module.exports = {
  apps: [
    {
      name: "breadcrumbs-backend",
      script: "npm",
      args: "start",
      cwd: "./server",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "breadcrumbs-frontend",
      script: "npm",
      args: "run dev",
      cwd: "./client",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

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
      args: "run dev", // Usually you'd serve built files, but for 'College server' simple dev/preview is often used
      cwd: "./client",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

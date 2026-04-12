require("dotenv").config({ path: "./config.env" });

module.exports = {
  apps: [
    {
      name: "admin",
      script: "server-admin.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.ADMIN_PORT
      }
    },
    {
      name: "client",
      script: "server-client.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.CLIENT_PORT
      }
    },
    {
      name: "expert",
      script: "server-expert.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.EXPERT_PORT
      }
    }
  ]
};
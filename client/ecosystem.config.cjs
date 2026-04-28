module.exports = {
    apps: [{
        name: "breadcrumbs-web",
        script: "./https-server.js",
        env: {
            NODE_ENV: "production",
            APP_PORT: 443,
            SSL_KEY_PATH: "",
            SSL_CERT_PATH: ""
        }
    }]
}
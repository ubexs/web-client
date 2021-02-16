/**
 * PM2 Ecosystem File PROD
 */
module.exports = {
    apps: [
        {
            // Script name
            name: "BlocksHub Game Client",
            script: "./dist/index.js",
            instances: 2,
            exec_mode: "cluster",
            watch: false,
            env: {
                "NODE_ENV": "production",
                "PORT": 6911,
            },
            listen_timeout: 60000,
            shutdown_with_message: true,
        }
    ]
}
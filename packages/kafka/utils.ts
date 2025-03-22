export function gracefulShutdown(shutdownStrategy: Function) {
    const errorTypes = ['unhandledRejection', 'uncaughtException'];
    const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    errorTypes.forEach(type => {
        process.on(type, async (e) => {
            try {
                console.log(`process.on ${type}`);
                console.error(e);
                shutdownStrategy()
                process.exit(0);
            } catch (_) {
                process.exit(1);
            }
        });
    });

    signalTraps.forEach(type => {
        process.once(type, async () => {
            try {
                console.log(`process.on ${type}`);
                shutdownStrategy()
            } finally {
                process.kill(process.pid, type);
            }
        });
    });
}


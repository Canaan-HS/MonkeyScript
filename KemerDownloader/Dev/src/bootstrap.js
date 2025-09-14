import Main from './app.js';

import.meta.env.DEV
    ? (() => {
        let currentCleanup = null;
        function run(mainFunc) {
            if (typeof currentCleanup === 'function') {
                currentCleanup();
            }

            currentCleanup = mainFunc();
        }

        run(Main);
        if (import.meta.hot) {
            import.meta.hot.accept('./app.js', (newAppModule) => {
                if (newAppModule && typeof newAppModule.default === 'function') {
                    run(newAppModule.default);
                } else {
                    import.meta.hot.invalidate();
                }
            });
        }
    })() : Main();
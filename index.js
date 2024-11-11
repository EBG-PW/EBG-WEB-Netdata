require('dotenv').config();
require('module-alias/register')

const port = process.env.PORT || 80;
const bindip = process.env.BINDIP || 'localhost';
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

const { log } = require('@lib/logger');


process.log = {};
process.log = log;

(async () => {
    try {
        setTimeout(() => {
            const app = require('@src/app');

            setTimeout(() => {
                if (process.env.ExtraErrorWebDelay > 0) {
                    process.log.system(`Webserver was delayed by ${process.env.ExtraErrorWebDelay || 500}ms beause of a error.`);
                }
                app.listen(port, bindip)
                    .then((socket) => process.log.system(`Listening on: ${bindip}:${port}`))
                    .catch((error) => process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`));
            }, 1500);
        }, process.env.GlobalWaitTime || 100);
    } catch (error) {
        process.log.error(`Failed to start webserver on: ${port}\nError: ${error}`);
    }
})();
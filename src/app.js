const HyperExpress = require('hyper-express');
const path = require('path');
const ejs = require('ejs');
const app = new HyperExpress.Server({
    fast_buffers: process.env.HE_FAST_BUFFERS == 'false' ? false : true || false,
});

const { log_errors } = require('@config/errors')

const apiv1 = require('@api');
app.use('/api/v1', apiv1);

/* Handlers */
app.set_error_handler((req, res, error) => {
    process.log.debug(error);
    const outError = {
        message: error.message || "",
        info: error.info || "",
        reason: error.reason || "",
        headers: error.headers || false,
        statusCode: error.status || 500, // Default to error 500
        back_url: error.back_url || false,
    }

    /* Returns 400 if the client didn´t provide all data/wrong data type*/
    if (error.name === "ValidationError" || error.name === "InvalidOption") {
        outError.message = error.name
        outError.info = error.message
        outError.reason = error.details
        outError.statusCode = 400;
    }

    /* Returns 401 if the client is not authorized*/
    if (error.message === "Token not provided" || error.message === "Token Invalid") {
        statusCode = 401;
    }

    /* Returns 403 if the client is not allowed to do something*/
    if (error.message === "NoPermissions" || error.message === "Permission Denied") {
        statusCode = 403;
    }

    /* Returns 429 if the client is ratelimited*/
    if (error.message === "Too Many Requests" || error.message === "Too Many Requests - IP Blocked") {
        statusCode = 429;
    }

    if (log_errors[error.name] && !error.secret_reason) process.log.error(`[${outError.statusCode}] ${req.method} "${req.url}" >> ${outError.message} in "${error.path}:${error.fileline}"`);
    if (log_errors[error.name] && error.secret_reason) process.log.error(`[${outError.statusCode}] ${req.method} "${req.url}" >> ${outError.message} in "${error.path}:${error.fileline}" >> ${error.secret_reason}`);
    if (error.error) console.log(error.error)
    res.status(outError.statusCode);
    if (outError.headers) { res.header(outError.headers.name, outError.headers.value); }
    if (outError.back_url) {
        outError.domain = process.env.DOMAIN; // Apend the domain to the error
        ejs.renderFile(path.join(__dirname, '..', 'views', 'error', 'error-xxx.ejs'), outError, (err, str) => {
            if (err) {
                res.json({
                    message: outError.message,
                    info: outError.info,
                    reason: outError.reason,
                });

                throw err;
            } else {
                res.header('Content-Type', 'text/html');
                res.send(str);
            }
        });
    } else {
        res.json({
            message: outError.message,
            info: outError.info,
            reason: outError.reason,
        });
    }
});

module.exports = app;
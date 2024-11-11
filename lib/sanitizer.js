const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

/**
 * Remove all html tags from a string
 * @param {string} string
 */
const fullysanitizedString = (joi) => ({
    type: 'fullysanitizedString',
    base: joi.string(),
    coerce(value, helpers) {
        if (value) {
            return { value: sanitizeHtml(value) };
        }
        return value;
    }
});

/**
 * Remove all html tags exept for <b>, <i>, <u>, <strong>, <em>, <h1>, <h2>, <h3>, <code>
 * @param {string} string
 */
const sanitizedString = ((joi) => ({
    type: 'sanitizedString',
    base: joi.string(),
    coerce(value, helpers) {
        if (value) {
            return {
                value: sanitizeHtml(value, {
                    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'code'])
                })
            };
        }
        return value;
    }
}));

/**
 * Makes sure that the number is within the safe range
 * @param {*} joi 
 * @returns 
 */
const safeNumber = (joi) => ({
    type: 'safeNumber',
    base: joi.number(),
    messages: {
        'safeNumber.base': '"value" must be a safe number',
    },
    rules: {
        safe: {
            validate(value, helpers) {
                if (value < Number.MIN_SAFE_VALUE || value > Number.MAX_SAFE_VALUE) {
                    return helpers.error('safeNumber.base');
                }
                return value;
            },
        },
    },
});

// Create an extended Joi object with all the extensions
const extendedJoi = Joi.extend(sanitizedString, fullysanitizedString, safeNumber);

module.exports = extendedJoi;
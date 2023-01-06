const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

const LoggerBase = winston.createLogger({
    level: 'info',
    defaultMeta: {
        service: 'ghe_backend',
    },
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'warning.log', level: 'warning' }),
        new winston.transports.File({ filename: 'info.log', level: 'info' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
module.exports = { LoggerBase };
var express         = require('express'),
    favicon         = require('serve-favicon'),
    robots          = require('express-robots'),
    http            = require('http'),
    path            = require('path'),
    helmet          = require('helmet'),
    compress        = require('compression')
    ;

var staticOptions = {
    dotfiles: 'ignore',
    etag: true,
    index: false,
    // maxAge: '1d',
    redirect: false
};

var app = express()
    .set('port', process.env.PORT)

    // Security
    .use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [
                "'self'",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'"
            ],
            scriptSrc: [
                "'self'",
                'www.google-analytics.com',
            ],
            fontSrc: [
                "'self'",
                'data:'
            ],
            imgSrc: [
                "'self'",
                'www.google-analytics.com',
            ],
            objectSrc: [
                "'none'",
            ]
        },
        browserSniff: true,
        loose: true,
    }))
    .use(helmet.dnsPrefetchControl())
    .use(helmet.frameguard({ action: 'deny' }))
    .disable('x-powered-by')
    .use(helmet.hsts({
        // 12 months 60 * 60 * 24 * 365
        maxAge: 31536000
    }))
    .use(helmet.ieNoOpen())
    .use(helmet.noSniff())
    .use(helmet.xssFilter())

    .use(robots({ UserAgent: '*' }))

//    .use(favicon(__dirname + '/favicon.ico'))

    .use(compress({
        filter: function (req, res) {
            return /json|text|javascript|css|svg/.test(res.getHeader('Content-Type'));
        },
        level: 9
    }))

    .use('/', express.static(__dirname, staticOptions))
    ;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

process.on('SIGTERM', function() {
    app.close(function() {
        console.log('Shutdown server');
        process.exit();
    });
});

app.listen(process.env.PORT, function() {
    console.log('Server listening on port '+process.env.PORT);
});

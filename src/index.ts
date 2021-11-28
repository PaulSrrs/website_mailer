import dotenv from "dotenv";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import nodeMailer from "nodemailer";
import handleBars from "handlebars";
import mg from "nodemailer-mailgun-transport";
import fs from "fs";

dotenv.config();
const app = express();
const port = process.env.SERVER_PORT || 3001;

app.use(bodyParser.json());

app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:4200'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type');
    next();
});

app.get('/', (req, res) => {
    res.send('Paul Surrans website mailer is online :)')
});

app.post('/send', (req, res) => {
    const body = req.body;
    Object.keys(body).forEach((key) => {
        body[key] = key !== 'email' ? (body[key].charAt(0).toUpperCase() + body[key].slice(1)) : body[key];
    });
    const message = `Un message important vous a été envoyé depuis votre site web paulsurrans.fr :\n\n${body.message}\n\n${body.firstname} ${body.lastname}`;
    const emailTemplateSource = fs.readFileSync(path.join(__dirname, "/templates/template.hbs"), "utf8");
    const mailgunAuth = {
        auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN
        }
    };
    const smtpTransport = nodeMailer.createTransport(mg(mailgunAuth));
    const template = handleBars.compile(emailTemplateSource);
    const htmlToSend = template({
        subject: body.subject,
        message
    });
    const mailOptions = {
        from: body.email,
        to: process.env.MAILGUN_RECEIVER,
        subject: body.subject,
        html: htmlToSend
    };

    try {
        smtpTransport.sendMail(mailOptions, (err, _) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                res.json({
                    success: true
                });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
})

app.listen(port,  () => {
    console.log(`Paul Surrans mailer running on port : ${port} !`)
});

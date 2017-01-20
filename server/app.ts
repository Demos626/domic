import * as express from 'express';
import { json, urlencoded } from 'body-parser';
import * as path from 'path';
import * as compression from 'compression';
import * as cors from 'cors';

import { loginRouter } from './routes/login';
import { protectedRouter } from './routes/protected';
import { publicRouter } from './routes/public';
import { feedRouter } from './routes/feed';
import {studyEntityRouter} from './routes/study_entity';
import { userRouter } from './routes/user';
import * as models from './models';

const app: express.Application = express();

app.disable('x-powered-by');

app.use(cors());
app.use(json());
app.use(compression());
app.use(urlencoded({ extended: true }));

// passport

let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function (email, password, done){
        models.User.findOne({'email': email})
        .exec((err, user) => {
            if (err || !user) {
                user = {};
            }
            if (password === user.password) {
                return done(true);
            } else {
                return done(null, false, {massage: 'Wrong data'});
            }
        });
    }
));

app.post('/login/test', passport.authenticate('local',
    { failureRedirect: 'http://localhost:4200',
      successRedirect: 'http://localhost:4200/'}));

// api routes
app.use('/api/secure', protectedRouter);
app.use('/api/login', loginRouter);
app.use('/api/public', publicRouter);
app.use('/api/feed', feedRouter);
app.use('/api/user', userRouter);
app.use('/api/study_entity', studyEntityRouter);

if (app.get('env') === 'production') {

  // in production mode run application from dist folder
  app.use(express.static(path.join(__dirname, '/../client')));
}

// catch 404 and forward to error handler
app.use(function(req: express.Request, res: express.Response, next) {
  let err = new Error('Not Found');
  next(err);
});

// production error handler
// no stacktrace leaked to user
app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {

  res.status(err.status || 500);
  res.json({
    error: {},
    message: err.message
  });
});

export { app }

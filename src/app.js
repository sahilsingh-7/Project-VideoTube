import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import healthcheckRoute from './routes/healthcheck.routes.js'
import {router as registerUser} from './routes/user.routes.js';

const app = express();

app.use(cors({origin:process.env.CORS_ORIGIN,credentials:true}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

app.use('/healthcheck',healthcheckRoute);
app.use('/users/register',registerUser);

export {app}
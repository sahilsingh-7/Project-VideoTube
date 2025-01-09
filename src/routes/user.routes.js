import {Router} from 'express'
import {registerUser} from '../controllers/registration.controllers.js';
import {upload} from '../middleware/multer.middlewares.js';


const router = Router();
router.post('/',
    upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]),
registerUser);
export {router};

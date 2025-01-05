import { app } from "./app.js";
import connectDB from "./db/index.js";


const port = process.env.PORT;

    connectDB()
    .then(()=>{
        app.listen(port,()=>{
            console.log(`server started at port ${port}`);
        })
    })
    .catch((err)=>{
        console.log("MongoDB connection failed",err);
    })




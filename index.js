import express, { urlencoded } from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import cors from "cors"
import userRouter from './routes/auth.route.js';


dotenv.config()
const app=express();
const port=process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.urlencoded({extended:true}))
app.use(cors({
    origin:process.env.BASE_URL,
    credentials:true,
    methods:['GET','POST','DELETE'],
    allowedHeaders:['Content-Type','Authorization']
}))
app.use(express.json());


app.get("/test",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"I am working"
    })
})

app.use('/api/v1/users',userRouter);

app.listen(port,()=>{
    console.log(`Backend is listening on the post : ${port}`)
})
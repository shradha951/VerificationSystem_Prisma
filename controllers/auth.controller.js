import {prisma}from '../lib/prisma.js'
import bcrypt from 'bcryptjs';
import crypto from "crypto"
import nodemailer from 'nodemailer';







export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=])[A-Za-z\d@$!%*?&#^()_+\-=]{8,}$/;

    return passwordRegex.test(password);
};


export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


const  generateTokenAndSave=async(userid)=>{
    const token=await crypto.randomBytes(32).toString("hex")

    try {

       const updatedUser= await prisma.user.update({
        where:{
            id:userid
        },
        data:{
        verificationToken:token,
        verificationTokenExpires:new Date(Date.now()+10*60*1000)
        }

    })
    console.log("UpdatedUser: "+updatedUser)
    return token;
        
    } catch (error) {
        console.log("Token saving failed:", error);
        return null;
    }
    
}

const hashPassword= async(password)=>{
    const hash= await bcrypt.hash(password,10);
    return hash;
}


const sendemail= async(email,token)=>{
    const transporter=nodemailer.createTransport({
        host:process.env.MAILTRAP_HOST,
        port:process.env.MAILTRAP_PORT,
        secure:false,
        auth:{
            user:process.env.MAILTRAP_USER,
            pass:process.env.MAILTRAP_PASSWORD
        }

    })

    const mailOptions={
        from:process.env.MAILTRAP_SENDEREMAIL,
        to:email,
        subject:"Verify Your Email",
        text:`please click on the following link:${process.env.BASE_URL}/api/v1/users/verify/${token}`
    }

    try {
        await transporter.sendMail(mailOptions)
        return true
    } catch (error) {
        console.log("Sending Email Failed",error)
        return false;
    }

}

export const registerUser=async (req,res)=>{

    const {name,email,password,phone}=req.body || {};

    if(!name || !email || !password ||!phone){
        return res.status(400).json({
            success:false,
            messages:"All fields are Required"
        })
    }

    if(!isValidEmail(email) || !isValidPassword(password)){
        return res.status(400).json({
            success:false,
            messages:"Data validation failed"
        })
    }

    try {
      const user=  await prisma.user.findUnique({
        where:{email}
      })

      console.log(user)

      if(user){
        //code to be continued for existing User
        try {


             if(user.isVerified){
            return res.status(400).json({
            success:false,
            message:"User already exist",
            user
        })
        }


        if(user.verificationToken){

            //if user has verification token but the token is expires then again generate the token and countnue with the mail process
            const isTokenExpired= !user.verificationTokenExpires || new Date(user.verificationTokenExpires)<=new Date();

            if(isTokenExpired){
                const newToken=await generateTokenAndSave(user.id)

                if(!newToken){
        return res.status(500).json({
        success: false,
        message: "User already Exist bit not verified.Unable to generate verification token./Email unsend"
    });
      }
      user.verificationToken=newToken
}

            




            const sendEmail=await sendemail(user.email,user.verificationToken);

            if(!sendEmail){
                return res.status(400).json({
                    success:false,
                    message:"User already exist but not verified",
                    error:"email cannot be send"
                })
            }

            return res.status(400).json({
                success:true,
                message:"User already exist but not verified. Verification email has been send "
            })
        }

        const newToken= await generateTokenAndSave(user.id)

        if(!newToken){
        return res.status(500).json({
        success: false,
        message: "User already Exist bit not verified.Unable to generate verification token./Email unsend"
    });
      }

      const sendEmail=await sendemail(user.email,newToken);

       if(!sendEmail){
                return res.status(400).json({
                    success:false,
                    message:"User already exist but not verified",
                    error:"email cannot be send"
                })
            }

            return res.status(200).json({
                success:true,
                message:"User already exist bot not verified check your email to verify yorself"
            })
            
        } catch (error) {
            return res.status(400).json({
                success:false,
                message:"User already exist but not verified",
                errormessage:"Troubble in verifying the User",
                error
            })
        }
      }

      //hashing the password
      const hashedPassword= await bcrypt.hash(password,10)
      

      //creating a user in the database
      const resp= await prisma.user.create({
        data:{
            name,
            email,
            password:hashedPassword,
            phone
        }
      })


      if(!resp){
        return res.status(400).json({
            success:false,
            messages:"User cannot be registered"
        })
      }
      
      const token= await generateTokenAndSave(resp.id);

      if(!token){
        return res.status(500).json({
        success: false,
        message: "Unable to generate verification token./Email unsend"
    });
      }

       const emailSend= await sendemail(resp.email,token)

       if(!emailSend){

        return res.status(500).json({
        success: false,
        message: "Unable to Send verification email"
    });
        
       }


      return res.status(201).json({
        success:true,
        messages:"User created successfully and Verification email send Succesfully",
        token:token,
        resp
      })


    } catch (error) {
        console.log(error)
        return res.status(400).json({
        success:false,
        messages:"User cannot be created",
        error
      })
    }

    

  







}


export const verifyUser=async (req,res)=>{

    const {token}=req.params;

    if(!token){
        return res.status(400).json({
            success:false,
            message:"Invalid token or url"
        })
    }

    try {

        const user= await prisma.user.findFirst({
        where:{verificationToken:token}
    })

    if(!user){
        return res.status(400).json({
            success:false,
            message:"Invalid token or url / no such user exist "
        })
    }

    const isTokenexpired=!user.verificationTokenExpires || new Date(user.verificationTokenExpires)<=new Date();

    if(isTokenexpired){
        const newToken=await generateTokenAndSave(user.id);

        if(!newToken){
            return res.status(400).json({
                success:false,
                message:"User cannot be verified / token expired / cannot generate new token"
            })
        }

        const sendEmail=await sendemail(user.email,newToken);
        if(!sendEmail){
            return res.status(400).json({
                success:"false",
                message:"User cannot be verified",
                error:"Veerification email cannot be send"
            })
        }

        return res.status(400).json({
            success:true,
            message:"Token expired / a new verication email is send to your mail click to verify"
        })

    }

    const updatedUser= await prisma.user.update({
        where:{id:user.id},
        data:{
            isVerified:true,
            verificationToken:null,
            verificationTokenExpires:null
        }
    })

    if(!updatedUser){
        return res.status(500).json({
            success:false,
            message:"Error in verifying the user / DataBase problem"
        })
    }

    return res.status(200).json({
        success:false,
        message:"User Verified succesfully"
    })
        
    } catch (error) {
        res.status(400).json({
        success:false,
        message:"User cannot be verified",
        error:error
    })
    }
}
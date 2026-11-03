import {prisma}from '../lib/prisma.js'
import bcrypt from 'bcryptjs';
import crypto from "crypto"





export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=])[A-Za-z\d@$!%*?&#^()_+\-=]{8,}$/;

    return passwordRegex.test(password);
};


export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const registerUser=async (req,res)=>{
    let messages=[];

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
        return res.status(400).json({
            success:false,
            messages:"User already exist",
            user
        })
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

      return res.status(201).json({
        success:true,
        messages:"User created successfully",
        user:resp
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
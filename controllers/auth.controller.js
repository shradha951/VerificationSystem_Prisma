import {prisma}from '../lib/prisma.js'

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

    const {name,email,password}=req.body || {};

    if(!name || !email || !password){
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
            messages:"User already exist"
        })
      }

      //creating a user in the database
      


    } catch (error) {
        
    }

    

  







}
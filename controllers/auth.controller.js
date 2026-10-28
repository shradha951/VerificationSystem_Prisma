export const registerUser= async (req,res)=>{
    console.log('user registered');
    res.status(200).json({
        success:true,
        message:"successfully registered"
    })
}
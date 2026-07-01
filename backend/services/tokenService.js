const jwt = require("jsonwebtoken") ;
const cookieParser = require("cookie-parser")

function generateAccessToken(user){
    const accessToken = jwt.sign({
        userId : user._id ,
        email : user.email , 
        role : user.role ,
    },
        process.env.JWT_SECRET ,
    {
        expiresIn : "15m"
    }) ;

    return accessToken ;
}

function generateRefreshToken(user){
    const refreshToken = jwt.sign({
        userId : user._id 
    } , process.env.JWT_REFRESH_SECRET ,
    {
        expiresIn : "7d"
    }
    )

    return refreshToken ;
}

function verifyAccessToken(token){
    const  decoded = jwt.verify(
        token , 
        process.env.JWT_SECRET
    ) ;
    return decoded
}

function verifyRefreshToken(token){
    const decoded = jwt.verify(
        token , 
        process.env.JWT_REFRESH_SECRET
    )

    return decoded ;
}

module.exports = {generateAccessToken , generateRefreshToken , verifyAccessToken , verifyRefreshToken}
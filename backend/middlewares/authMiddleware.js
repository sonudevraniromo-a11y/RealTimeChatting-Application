const jwt = require("jsonwebtoken")
const {verifyAccessToken} = require("../services/tokenService")
const cookieParser = require("cookie-parser")


const authMiddleware = ( req , res , next ) => {
    
    const authHeader = req.headers.authorization ;

    if(!authHeader){
        return res.status(401).json({
            message : "no token"
        })
    }

    const token = authHeader.split(" ")[1] ;

    try{
        const decoded = verifyAccessToken(token) ;
        req.user = decoded ;
        next() ;
    }catch(err){
        res.status(401).json({
            message : "invalid Token"
        })
    }
}

module.exports = authMiddleware ;
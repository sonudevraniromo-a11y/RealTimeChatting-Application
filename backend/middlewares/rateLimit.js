const rateLimit = require("express-rate-limit") ;

const loginLimiter = rateLimit({
    windowMs : 60 * 1000 * 15 ,
    max : 5 ,
    message : {
        message : "too many login Attempts . Try again after 15 min"
    } ,
    standardHeaders : true ,
    legacyHeaders : false ,
})

module.exports = {
    loginLimiter ,
} ;
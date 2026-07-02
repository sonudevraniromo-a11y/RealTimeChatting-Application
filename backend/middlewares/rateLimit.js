const rateLimit = require("express-rate-limit") ;

const loginLimiter = rateLimit({
    windowMs : 1000 ,
    max : 10 ,
    message : {
        message : "too many login Attempts . Try again after 15 min"
    } ,
    standardHeaders : true ,
    legacyHeaders : false ,
})

module.exports = {
    loginLimiter ,
} ;
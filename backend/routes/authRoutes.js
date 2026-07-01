const express = require('express') ;
const route = express.Router() ;
const {login, register, refresh , logOutAll, logOut, resetPassword , forgotPassword , verifyEmail , resendVerification } = require("../controllers/authControllers")
const authMiddleware = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimit');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validator/authValidator");
const validateRequest = require('../middlewares/validateRequest');




route.post('/login' , loginLimiter , loginValidator , validateRequest , login ) ;
route.post('/register' , registerValidator , validateRequest , register) ;
route.post('/refresh' , refresh) ;
route.post('/forgot-password' , forgotPasswordValidator , forgotPassword)
route.post('/reset-password/:token' , resetPasswordValidator , resetPassword)
route.get("/verify-email/:token", verifyEmail);
route.post("/resend-verification", resendVerification);
route.post('/logout-all'  , authMiddleware , logOutAll ) ;
route.post('/logOut' , authMiddleware , logOut )



module.exports = route ; 
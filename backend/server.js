require("dotenv").config() ;
const { login , refresh , register , profile } = require("./controllers/authControllers");
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const conversationRoutes = require('./routes/conversationRoutes')
const messageRoutes = require('./routes/messageRoutes')
const connectDB = require("./config/db")
const cors = require('cors')
const authMiddleware = require('./middlewares/authMiddleware')

const express = require('express') ;
const cookieParser = require("cookie-parser");
const helmet = require('helmet') ;
const morgon = require('morgan') ;
const errorMiddleware = require("./middlewares/errorMiddleware")
const path = require("path");


const app = express() ;

app.use(cors({
    origin : 'http://localhost:5173' ,
    credentials : true 
}))

connectDB() ;

app.use(express.json()) ;
app.use(cookieParser()) ;
// app.use(
//   helmet({
//     crossOriginResourcePolicy: false,

//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         imgSrc: ["'self'", "data:", "http://localhost:5000"],
//       },
//     },
//   }),
// );
app.use(morgon("dev")) ;

app.use(errorMiddleware);
app.use('/api/auth', authRoutes ) ;
app.use('/api/user', userRoutes ) ;
app.use('/api/conversation' , conversationRoutes ) ;
app.use('/api/message' , messageRoutes )
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  }),
);

app.get("/" , (req ,res) => {
    res.send("backend running") ;
})

app.get("/profile", authMiddleware, profile);


const http = require('http') ;
const initializeSocket = require("./socket/socket");

const server = http.createServer(app)

const io = initializeSocket(server) ;



server.listen(5000 , () => {
    console.log("server is running at port : 5000 ")
}) ;


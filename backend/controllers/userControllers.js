const { response } = require('express');
const User = require('../models/userSchema') ;
const bcrypt = require('bcrypt') ;


exports.deleteUser = async (req , res) => {
    try{
        if(req.user.userId === req.params.id){
            return res.status(400).json({
                message : "you cannot delete yourself"
            })
        }
        const user = await User.findByIdAndDelete(req.params.id)

        if(!user){
            return res.status(404).json({
                message : "userNOTFound" 
            })
        }

        res.json({
            message : "user Delete SuccessFully "
        })
    }catch(error){
        res.status(500).json({
            message : " server Error "
        })
    }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.userId } },
      "-password",
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Get All Users Server Error",
    });
  }
};

exports.changeRole = async (req , res ) => {
    try{
       const user = await User.findById(req.params.id) ;
       if(!user){
        return res.status(404).json({
            message : "user Not found" ,
        }) ;
       }

       user.role = user.role === "admin" ? "user" : "admin" ;

       await user.save() ;

       res.json({
        message : "role Updated" ,
        user ,
       }) ;
    }catch(err){
        res.status(500).json({
            message : "server Error",
        })
    } 
}

exports.changePassword = async (req , res) => {
    try{
        const {oldPassword , newPassword} = req.body ;

        const user = await User.findById(req.user.userId);

        if(!user){
            return res.status(401).json({
                message : "user not Exist"
            })
        }

  const isMatch = await bcrypt.compare(oldPassword, user.password);


const hashedPassword = await bcrypt.hash(newPassword, 10);

user.password = hashedPassword;

await user.save();

        res.json({
            message : "password changed Successfully"
        })
    }catch(error){
         res.status(500).json({
           message: "Server Error",
         });
    }
}

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("name email avatar");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
    });
  }
};
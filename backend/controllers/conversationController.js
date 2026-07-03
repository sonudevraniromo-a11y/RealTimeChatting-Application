const Conversation = require("../models/Conversation") ;
const User = require("../models/userSchema") 


exports.createConversation = async ( req , res ) => {
    try{
        const {receiverId} = req.body ;
        const senderId = req.user.userId ;

        if (!receiverId) {
          return res.status(400).json({
            message: "Receiver ID is required",
          });
        }

        if (senderId === receiverId) {
          return res.status(400).json({
            message: "You cannot create a conversation with yourself",
          });
        }

        const receiver = await User.findById(receiverId) ;

        if(!receiver) {
            return res.status(404).json({
                message :  "reciever User Not found"
            })
        }

        const existingConvo = await Conversation.findOne({
          participants: {
            $size: 2,
            $all: [senderId, receiverId],
          },
        }); 

        if(existingConvo){
            return res.status(200).json({
                message : "existing conversation" ,
                conversation : existingConvo
            })
        }

        const convo = new Conversation({
            participants : [senderId , receiverId ] ,
        })

        await convo.save() ;

        return res.status(201).json({
            message : "Conversation created successfully" ,
            conversation : convo 
        })
  
    }catch(error){
        console.error(error);

        return res.status(500).json({
          message: "Internal Server Error",
          error: error.message,
        });
    }
}

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name avatar isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name avatar",
        },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const userId = req.user.userId;

    const convo = await Conversation.findById(conversationId);

    if (!convo) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    convo.unreadCount.set(userId, 0);

    await convo.save();

    res.json({
      message: "Marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};
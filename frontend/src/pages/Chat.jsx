import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadChats, setUnreadChats] = useState({});

  return (
    <div className="chat-page">
      <Sidebar
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        unreadChats={unreadChats}
        setUnreadChats={setUnreadChats}
      />

      <ChatWindow
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        unreadChats={unreadChats}
        setUnreadChats={setUnreadChats}
      />
    </div>
  );
}

export default Chat;

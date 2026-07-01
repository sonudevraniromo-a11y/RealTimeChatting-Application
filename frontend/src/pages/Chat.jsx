import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadChats, setUnreadChats] = useState({});

  return (
    <div className="d-flex vh-100">
      <Sidebar
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        unreadChats={unreadChats}
        setUnreadChats={setUnreadChats}
      />

      <ChatWindow
        selectedConversation={selectedConversation}
        unreadChats={unreadChats}
        setUnreadChats={setUnreadChats}
      />
    </div>
  );
}

export default Chat;

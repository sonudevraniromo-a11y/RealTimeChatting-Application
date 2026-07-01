import { createContext, useContext, useEffect, useState } from "react";
import socket from "../Services/socket";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    socket.connect();

    socket.emit("setup", token);

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online_users");
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

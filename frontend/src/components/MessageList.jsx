import Message from "./Message";
import DateDivider from "./DateDivider";

export default function MessageList({
  messages,
  currentUserId,
  messageRefs,
  setMessages,
  setReplyMessage,
  openImage,
  bottomRef,
}) {
  if (messages.length === 0) {
    return (
      <div className="empty-chat-state">
        <div className="circle-illustration" />
        <h4>No messages yet</h4>
        <p>Send the first message to start the conversation.</p>
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <>
      {messages.map((message, index) => {
        const current = new Date(message.createdAt).toDateString();
        const previous =
          index > 0
            ? new Date(messages[index - 1].createdAt).toDateString()
            : null;

        return (
          <div key={message._id}>
            {current !== previous && <DateDivider date={current} />}
            <Message
              message={message}
              currentUserId={currentUserId}
              openImage={openImage}
              setMessages={setMessages}
              setReplyMessage={setReplyMessage}
              messageRefs={messageRefs}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </>
  );
}

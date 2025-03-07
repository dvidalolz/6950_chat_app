import React, { forwardRef } from 'react'; 

// chats and user passed from chatcontainer
const ChatList = forwardRef(({ chats, user }, ref) => {

  // Messages from you, right
  function SenderChat({ message, username, avatar }) {
    return (
      <div className="chat_sender">
        <img src={avatar} alt="" />
        <p>
          <strong>{username}</strong> <br />
          {message}
        </p>
      </div>
    );
  }

  // other peoples messages, left
  function ReceiverChat({ message, username, avatar }) {
    return (
      <div className="chat_receiver">
        <img src={avatar} alt="" />
        <p>
          <strong>{username}</strong> <br />
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="chat_list" ref={ref}> {}
      {chats.map((chat, index) => {
        if (chat.username === user) { 
          return (
            <SenderChat // display as senderchat if you sent
              key={index}
              message={chat.message}
              username={chat.username}
              avatar={chat.avatar}
            />
          );
        } else {
          return (
            <ReceiverChat // display as otherchat if someone else sent message
              key={index}
              message={chat.message}
              username={chat.username}
              avatar={chat.avatar}
            />
          );
        }
      })}
    </div>
  );
});

export default ChatList;
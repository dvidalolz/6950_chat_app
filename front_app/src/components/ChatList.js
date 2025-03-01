import React from 'react';

const ChatList = ({ chats, user }) => {
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
    <div className='chat_list'>
      {chats.map((chat, index) => {
        if (chat.username === user) {
          return (
            <SenderChat
              key={index}
              message={chat.message}
              username={chat.username}
              avatar={chat.avatar}
            />
          );
        } else {
          return (
            <ReceiverChat
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
};

export default ChatList;
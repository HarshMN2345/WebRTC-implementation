import React,{useState} from 'react'
import { useCallback,useEffect} from 'react';
import { useNavigate} from 'react-router-dom';
import {useSocket} from '../../src/context/SocketProvider'

const Lobby = () => {
    const [email,setEmail]=useState("");
    const [room,setRoom]=useState("");
    const socket=useSocket();
    const navigate=useNavigate();
    console.log(socket);
    const submitform=useCallback((e)=>{
        e.preventDefault();
        socket.emit("room:join",{email,room})  
    },
    [email,room,socket]
  );
  const handlejoinroom=useCallback((data)=>{
    const { email,room}=data;
    navigate(`/room/${room}`);
  },
  [navigate]
);
  useEffect(()=>{
    socket.on('room:join',handlejoinroom);
    return()=>{
      socket.off("room:join",handlejoinroom)
    }
  },[socket]);
  
  return (
    <>
    <div>Lobby</div>
    <form onSubmit={submitform}>
       <label htmlFor='email'>Email Id</label>
       <input type="email" id="email" value={email} onChange={(e)=>setEmail(e.target.value)}></input>
       <br/>
       <label htmlFor='room'>Room Number</label>
       <input type="text" id="room" value={room} onChange={(e)=>setRoom(e.target.value)}></input>
       <br/>
       <button>Join</button>
    </form>
    </>
  )
}

export default Lobby
import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

const Room = () => {
    const socket = useSocket()
    const [remoteSocketid, setRemoteSocketid] = useState(null);
    const [myStream, setMystream] = useState(null);
    const [remoteStream, setRemoteStream] = useState();
    const handleuserjoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`)
        setRemoteSocketid(id);

    })
    const handlecalluser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMystream(stream)
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketid, offer })
    }, [remoteSocketid, socket])
    const handleincommingcall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketid(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMystream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );
    const SendStreams=useCallback(()=>{
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream)
        }
    },[myStream]);
    const handlecallaccepted = useCallback(({ from, ans }) => {
        peer.setLocalDescription(ans);
        console.log("call accepted");
        SendStreams();
    }, [SendStreams]);
    const handleNegotiation = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', {
            offer, to: remoteSocketid
        })
    }, [remoteSocketid, socket]);
    const handleNegotiationincomming=useCallback(async({from,offer})=>{
       const ans=await peer.getAnswer(offer);
       socket.emit('peer:nego:done',{to:from,ans});
    },[socket])
    const handleNegotiationFinal=useCallback(async({ans})=>{
        await peer.setLocalDescription(ans)

    },[])
    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegotiation)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegotiation)
        }
    }, [handleNegotiation])
    useEffect(() => {
        peer.peer.addEventListener('track', async ev => {
            const remoteStream = ev.streams
            console.log('get tracks')
            setRemoteStream(remoteStream[0]);
        })
    })
    useEffect(() => {
        socket.on('user:joined', handleuserjoined);
        socket.on('incomming:call', handleincommingcall)
        socket.on('call:accepted', handlecallaccepted)
        socket.on('peer:nego:needed',handleNegotiationincomming)
        socket.on('peer:nego:final',handleNegotiationFinal)
        return () => {
            socket.off('user:joined', handleuserjoined);
            socket.off('incomming:call', handleincommingcall);
            socket.off('call:accepted', handlecallaccepted);
            socket.off('peer:nego:needed',handleNegotiationincomming);
        socket.off('peer:nego:final',handleNegotiationFinal);

        }
    }, [socket, handleuserjoined, handleincommingcall,handleNegotiationFinal,handleNegotiationincomming,handlecallaccepted])
    return (
        <div><h1>Rooom pAGE</h1>
            <h4>{remoteSocketid ? 'Connected' : 'room is empty'}</h4>
            { myStream && <button onClick={SendStreams}>Send Stream</button>}
            {remoteSocketid && <button onClick={handlecalluser}>Call</button>}
            {myStream && <><h1>My Stream</h1> <ReactPlayer playing muted height="300px" width="600px" url={myStream}></ReactPlayer></>}
            {remoteStream && <><h1>Remote Stream</h1> <ReactPlayer playing muted height="300px" width="600px" url={remoteStream}></ReactPlayer></>}
        </div>
    )
}

export default Room
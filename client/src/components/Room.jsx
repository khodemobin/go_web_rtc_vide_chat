import React, { useEffect, useRef } from "react";

const Room = (props)=>{
    const userVideo = useRef();
    const userStream = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const webSocketRef = useRef();
    
    const openCamera = async ()=>{
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = allDevices.filter((device)=> device.kind == "videoinput")
   
        const constraints = {
            audio :true,
            video:{
                deviceId:cameras[1].deviceId
            }     
        }


        try {
            return await navigator.mediaDevices.getUserMedia(constraints)
        } catch (error) {   
            console.log(error);
        }
   
    }


    useEffect(()=>{
        openCamera().then((stream)=>{
            
        })




        // const ws = new WebSocket(`ws://localhost:8080/join?roomID=${props.match.params.roomID}`)
        // ws.addEventListener("open",()=>{
        //     ws.send(JSON.stringify({ join:"true" }));
        // });

        // ws.addEventListener("message",(e)=>{
        //     console.log(e.data);           
        // })
    })


    return (
        <div>
            <video autoPlay controls={true}></video>
            <video autoPlay controls={true}></video>
        </div>
    );
}


export default Room
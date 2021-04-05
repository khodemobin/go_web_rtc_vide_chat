import React, { useEffect, useRef } from "react";

const Room = (props) => {
  const userVideo = useRef();
  const userStream = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const webSocketRef = useRef();

  const openCamera = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const cameras = allDevices.filter((device) => device.kind == "videoinput");

    const constraints = {
      audio: true,
      video: {
        deviceId: cameras[1].deviceId,
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    openCamera().then((stream) => {
      userVideo.current.srcObject = stream;
      userStream.current = stream;

      webSocketRef.current = new WebSocket(
        `ws://localhost:8080/join?roomID=${props.match.params.roomID}`
      );

      webSocketRef.current.addEventListener("open", () => {
        ws.send(JSON.stringify({ join: "true" }));
      });

      webSocketRef.current.addEventListener("message", async (e) => {
        const message = JSON.parse(e.data);
        if (message.join) {
          callUser();
        }

        if (message.iceCandidate) {
          console.log("Receive and adding iceCandidate ");
          try {
            await peerRef.current.addIceCandidate(message.iceCandidate);
          } catch (error) {
            console.log(error);
          }
        }

        if (message.offer) {
          handleOffer(message.offer);
        }

        if (message.answer) {
          console.log("Receive answer");
          peerRef.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
        }
      });
    });
  });

  const handleOffer = async (offer) => {
    console.log("Receive offer");
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    webSocketRef.current.send(
      JSON.stringify({
        answer: peerRef.current.localDescription,
      })
    );
  };

  const callUser = () => {
    console.log("Calling other user");
    peerRef.current = createPeer();

    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });
  };

  const createPeer = () => {
    console.log("Creating peer connection");
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onnegotiationneeded = handleNegotiationneeded;
    peer.onicecandidate = handleIcecandidateEvent;
    peer.ontrack = handleTrackEvent;
  };

  const handleNegotiationneeded = async () => {
    console.log("Creating offer");
    try {
      const myOffer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(myOffer);
      webSocketRef.current.send(
        JSON.stringify({
          offer: peerRef.current.localDescription,
        })
      );
    } catch (error) {}
  };
  const handleIcecandidateEvent = (e) => {
    if (e.candidate) {
      webSocketRef.current.send(
        JSON.stringify({
          iceCandidate: e.candidate,
        })
      );
    }
  };
  const handleTrackEvent = (e) => {
    partnerVideo.current.srcObject = e.streams[0];
  };

  return (
    <div>
      <video autoPlay controls={true}></video>
      <video autoPlay controls={true}></video>
    </div>
  );
};

export default Room;

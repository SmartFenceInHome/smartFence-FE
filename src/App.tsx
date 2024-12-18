import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

import { AlertCircle, Terminal } from "lucide-react";

import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// const socket = io("http://192.168.1.7:8080", {
//   transports: ["websocket", "polling"], // polling을 폴백으로 추가
//   timeout: 20000, // 타임아웃 시간 증가
//   forceNew: true,
//   reconnectionDelay: 1000,
//   reconnection: true,
//   reconnectionAttempts: Infinity, // 재연결 시도 횟수를 늘림
//   pingInterval: 1000, // ping 간격 조정
//   pingTimeout: 5000, // ping 타임아웃 설정
// });
const socket = io("http://192.168.1.7:8080", {
  transports: ["websocket"], // polling 제거하고 웹소켓만 사용
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 100, // 재연결 딜레이 최소화
  timeout: 5000, // 타임아웃 줄이기
});

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // 자동문
  // const [warning, setWarning] = useState(false); // 경고문

  const [distance, setDistance] = useState<number>(0);
  const [detection, setDetection] = useState<boolean>(false);
  const [frame, setFrame] = useState(null);

  // const [lastReceiveTime, setLastReceiveTime] = useState(Date.now());

  // WebSocket 연결
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    // 초음파 센서 데이터 받기
    socket.on("ultrasonic_data", (data) => {
      // const now = Date.now();
      // const timeDiff = now - lastReceiveTime;
      console.log("거리:", data.distance, new Date().toISOString());
      console.log("감지:", data.object_detected, new Date().toISOString());

      setDistance(data.distance);
      setDetection(data.object_detected);
      // setLastReceiveTime(now);
    });

    // 서보모터 상태 받기
    socket.on("servo_status", (data) => {
      console.log(data);
      setIsOpen(data.status);
    });

    // 카메라 이미지 받기 (3초마다)
    socket.on("camera_frame", (data) => {
      console.log("get image");
      // console.log(data.image);
      setFrame(data.image);
    });

    // socket.on("warning", () => {
    //   console.log("warning");
    //   setWarning(true);
    // });

    // 서버 연결 해제시 cleanup
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // 초음파 센서 데이터 요청
  const requestUltrasonicData = () => {
    // socket.emit("get_ultrasonic");
  };

  // 서보모터 제어 요청
  const openDoor = () => {
    socket.emit("move_servo", { isOpen: true });
    // setWarning(false);
  };
  const closeDoor = () => {
    socket.emit("move_servo", { isOpen: false });
  };
  // const moveServo = (isOpen: boolean) => {
  //   socket.emit("move_servo", { isOpen });
  //   setSurvoStatus(isOpen);
  // };

  useEffect(() => {
    requestUltrasonicData();
  }, []);

  if (!isConnected) return null;

  return (
    <>
      <div className="bg-white flex flex-col justify-between gap-4">
        {/* 알림 */}
        <div className="w-full">
          {!distance ? (
            <Alert variant="default">
              <Terminal className="w-4 h-4" />
              <AlertTitle>ㅡ</AlertTitle>
              <AlertDescription>ㅡ</AlertDescription>
            </Alert>
          ) : distance < 50 && detection ? (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>물체 근접!</AlertTitle>
              <AlertDescription>
                물체와의 거리가 <span className="font-bold">{distance} cm</span>{" "}
                로 매우 가까워 스마트 펜스를 닫습니다.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default">
              <Terminal className="w-4 h-4" />
              <AlertTitle>안전 모드</AlertTitle>
              <AlertDescription className="flex flex-col">
                <div className="flex gap-1">
                  <span>물체와의 거리</span>
                  <span className="text-blue-500 font-bold">{distance} cm</span>
                </div>
                <div className="flex gap-1">
                  <span>물체 탐지</span>
                  <span className="text-blue-500 font-bold">
                    {detection ? "O" : "X"}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
        {/* 카메라 (가능 여부 확인 후 추가) */}
        <div className="border w-full h-auto flex justify-center items-center overflow-hidden">
          {frame ? (
            <img
              src={`data:image/jpeg;base64,${frame}`}
              alt="Camera Feed"
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
          ) : (
            <div>카메라 피드 대기 중...</div>
          )}
        </div>
        {/* 버튼 및 거리 확인 */}
        <div className="flex flex-col justify-center gap-2">
          <Button variant="ghost" disabled>
            물체와의 거리 {distance}cm
          </Button>
          {isOpen === true ? (
            <Button variant="destructive" size="lg" onClick={() => closeDoor()}>
              스마트 펜스 닫기
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={() => openDoor()}
              className="bg-blue-500 hover:bg-blue-400"
            >
              스마트 펜스 열기
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default App;

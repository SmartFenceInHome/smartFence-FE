import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

import { AlertCircle, Terminal } from "lucide-react";

import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// TODO : ip 주소 변경
const socket = io("http://<raspberry-pi-ip>:8000");

const App = () => {
  // TODO: 초음파 센서 거리 받아오기
  const [distance, setDistance] = useState<string | null>(null);
  const [servoStatus, setSurvoStatus] = useState<boolean>(true);
  const [frame, setFrame] = useState(null);

  // WebSocket 연결
  useEffect(() => {
    // 초음파 센서 데이터 받기
    socket.on("ultrasonic_data", (data) => {
      setDistance(data.distance);
    });

    // 서보모터 상태 받기
    socket.on("servo_status", (data) => {
      setSurvoStatus(data.status);
    });

    // 카메라 이미지 받기 (3초마다)
    socket.on("camera_frame", (data) => {
      setFrame(data.image);
    });

    // 서버 연결 해제시 cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // 초음파 센서 데이터 요청
  const requestUltrasonicData = () => {
    socket.emit("get_ultrasonic");
  };

  // 서보모터 제어 요청
  const moveServo = (isOpen: boolean) => {
    socket.emit("move_servo", { isOpen });
    setSurvoStatus(isOpen);
  };

  useEffect(() => {
    requestUltrasonicData();
    moveServo(true); // 초기에 열어놓기
  }, []);

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
          ) : Number(distance) > 50 ? (
            <Alert variant="default">
              <Terminal className="w-4 h-4" />
              <AlertTitle>안전 모드</AlertTitle>
              <AlertDescription>
                물체와의 거리가{" "}
                <span className="text-blue-500 font-bold">{distance} cm</span>{" "}
                로 충분히 안전하여 스마트 펜스를 열어둡니다.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>물체 근접!</AlertTitle>
              <AlertDescription>
                물체와의 거리가 <span className="font-bold">{distance} cm</span>{" "}
                로 매우 가까워 스마트 펜스를 닫습니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
        {/* 카메라 (가능 여부 확인 후 추가) */}
        <div
          className="border w-full h-[50vh] flex justify-center items-center"
          style={{
            backgroundImage: `url()`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
          <Button
            variant={servoStatus ? "destructive" : "default"}
            size="lg"
            onClick={() => moveServo(!servoStatus)}
            className={servoStatus ? "" : "bg-blue-500 hover:bg-blue-400"}
          >
            스마트 펜스 {servoStatus ? "닫기" : "열기"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default App;

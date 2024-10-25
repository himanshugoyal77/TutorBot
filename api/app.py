from flask import Flask, jsonify, Response, request
import enum
import logging
import cv2
import numpy as np
import mediapipe as mp
from collections import deque

app = Flask(__name__)

class VideoCamera(object):
    def __init__(self):
      self.video = cv2.VideoCapture(0)
    def __del__(self):
      self.video.release()

    def GetVideoCapture(self):
        return self.video

class DisplayType(enum.Enum):
    CameraOverlapDisplay = 0
    BlankCanvasDisplay = 1


def GenerateFrames(camera: VideoCamera, displayType: DisplayType):
    # Giving different arrays to handle colour points of different colour
    bpoints = [deque(maxlen=1024)]
    gpoints = [deque(maxlen=1024)]
    rpoints = [deque(maxlen=1024)]
    ypoints = [deque(maxlen=1024)]

    # These indexes will be used to mark the points in particular arrays of specific colour
    blue_index = 0
    green_index = 0
    red_index = 0
    yellow_index = 0

    #The kernel to be used for dilation purpose 
    kernel = np.ones((5,5),np.uint8)

    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (0, 255, 255)]
    colorIndex = 0

    # initialize mediapipe
    mpHands = mp.solutions.hands
    hands = mpHands.Hands(max_num_hands=1, min_detection_confidence=0.7)
    mpDraw = mp.solutions.drawing_utils

    while True:
        success, frame = camera.GetVideoCapture().read()
        if not success:
            break

        # Process frame using OpenCV for air canvas effect
        x, y, c = frame.shape

        # Flip the frame vertically
        frame = cv2.flip(frame, 1)
        #hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        framergb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # This is where the decision happens
        if displayType == DisplayType.CameraOverlapDisplay:
            frame = frame
        elif displayType == DisplayType.BlankCanvasDisplay:
            frame = np.zeros((471,636,3)) + 255

        frame = cv2.rectangle(frame, (40,1), (140,30), (0,0,0), 1)
        frame = cv2.rectangle(frame, (160,1), (255,30), (255,0,0), 1)
        frame = cv2.rectangle(frame, (275,1), (370,30), (0,255,0), 1)
        frame = cv2.rectangle(frame, (390,1), (485,30), (0,0,255), 1)
        frame = cv2.rectangle(frame, (505,1), (600,30), (0,255,255), 1)
        cv2.putText(frame, "CLEAR", (49, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_4)
        cv2.putText(frame, "BLUE", (185, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_4)
        cv2.putText(frame, "GREEN", (298, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_4)
        cv2.putText(frame, "RED", (420, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_4)
        cv2.putText(frame, "YELLOW", (520, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_4)
        #frame = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

        # Get hand landmark prediction
        result = hands.process(framergb)

        # post process the result
        if result.multi_hand_landmarks:
            landmarks = []
            for handslms in result.multi_hand_landmarks:
                for lm in handslms.landmark:
                    # # print(id, lm)
                    # print(lm.x)
                    # print(lm.y)
                    lmx = int(lm.x * 640)
                    lmy = int(lm.y * 480)

                    landmarks.append([lmx, lmy])

                # Drawing landmarks on frames
                mpDraw.draw_landmarks(frame, handslms, mpHands.HAND_CONNECTIONS)

            fore_finger = (landmarks[8][0],landmarks[8][1])
            center = fore_finger
            thumb = (landmarks[4][0],landmarks[4][1])
            cv2.circle(frame, center, 3, (0,255,0),-1)
            print(center[1]-thumb[1])
            if (thumb[1]-center[1]<30):
                bpoints.append(deque(maxlen=512))
                blue_index += 1
                gpoints.append(deque(maxlen=512))
                green_index += 1
                rpoints.append(deque(maxlen=512))
                red_index += 1
                ypoints.append(deque(maxlen=512))
                yellow_index += 1

            elif center[1] <= 65:
                if 40 <= center[0] <= 140: # Clear Button
                    bpoints = [deque(maxlen=512)]
                    gpoints = [deque(maxlen=512)]
                    rpoints = [deque(maxlen=512)]
                    ypoints = [deque(maxlen=512)]

                    blue_index = 0
                    green_index = 0
                    red_index = 0
                    yellow_index = 0

                    # paintWindow[67:,:,:] = 255
                elif 160 <= center[0] <= 255:
                        colorIndex = 0 # Blue
                elif 275 <= center[0] <= 370:
                        colorIndex = 1 # Green
                elif 390 <= center[0] <= 485:
                        colorIndex = 2 # Red
                elif 505 <= center[0] <= 600:
                        colorIndex = 3 # Yellow
            else :
                if colorIndex == 0:
                    bpoints[blue_index].appendleft(center)
                elif colorIndex == 1:
                    gpoints[green_index].appendleft(center)
                elif colorIndex == 2:
                    rpoints[red_index].appendleft(center)
                elif colorIndex == 3:
                    ypoints[yellow_index].appendleft(center)
        # Append the next deques when nothing is detected to avois messing up
        else:
            bpoints.append(deque(maxlen=512))
            blue_index += 1
            gpoints.append(deque(maxlen=512))
            green_index += 1
            rpoints.append(deque(maxlen=512))
            red_index += 1
            ypoints.append(deque(maxlen=512))
            yellow_index += 1

        # Draw lines of all the colors on the canvas and frame
        points = [bpoints, gpoints, rpoints, ypoints]
        # for j in range(len(points[0])):
        #         for k in range(1, len(points[0][j])):
        #             if points[0][j][k - 1] is None or points[0][j][k] is None:
        #                 continue
        #             cv2.line(paintWindow, points[0][j][k - 1], points[0][j][k], colors[0], 2)
        for i in range(len(points)):
            for j in range(len(points[i])):
                for k in range(1, len(points[i][j])):
                    if points[i][j][k - 1] is None or points[i][j][k] is None:
                        continue
                    cv2.line(frame, points[i][j][k - 1], points[i][j][k], colors[i], 2)
                    # cv2.line(paintWindow, points[i][j][k - 1], points[i][j][k], colors[i], 2)
        
        cv2.line(frame, (-50, -50), (-100, -100), color=(255, 255, 255))

        # Convert the processed frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video')
def LiveVideo():
    displayType = request.args.get('type', default='camera', type=str)
    if (displayType == 'camera'):
        return Response(GenerateFrames(VideoCamera(), displayType=DisplayType.CameraOverlapDisplay), mimetype='multipart/x-mixed-replace; boundary=frame')
    elif (displayType == 'blank'):
        return Response(GenerateFrames(VideoCamera(), displayType=DisplayType.BlankCanvasDisplay), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True)

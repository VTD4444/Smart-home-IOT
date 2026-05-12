@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "BROKER_DIR=D:\Mosquitto"
set "BROKER_EXE=%BROKER_DIR%\mosquitto.exe"
set "BROKER_CONF=%BROKER_DIR%\mosquitto.conf"
set "BROKER_HOST=192.168.188.181"
set "BROKER_PORT=8000"
set "MQTT_USER=dinhvutrungduc"
set "MQTT_PASS=123456"

if not exist "%BROKER_EXE%" (
  echo [ERROR] Khong tim thay %BROKER_EXE%
  echo Hay sua BROKER_DIR trong file start_iot_env.bat cho dung may cua ban.
  pause
  exit /b 1
)

if not exist "%BROKER_CONF%" (
  echo [ERROR] Khong tim thay %BROKER_CONF%
  echo Hay sua BROKER_CONF trong file start_iot_env.bat.
  pause
  exit /b 1
)

echo Mo cac terminal can thiet...
start "Mosquitto Broker" cmd /k "\"%BROKER_EXE%\" -c \"%BROKER_CONF%\" -v"
start "PIO Upload" cmd /k "cd /d \"%PROJECT_DIR%\" && pio run -t upload"
start "PIO Monitor" cmd /k "cd /d \"%PROJECT_DIR%\" && pio device monitor -b 115200"
start "MQTT Sensor Sub" cmd /k "\"%BROKER_DIR%\mosquitto_sub.exe\" -h %BROKER_HOST% -p %BROKER_PORT% -u %MQTT_USER% -P %MQTT_PASS% -t hw/sensor -v"
start "MQTT Feedback Sub" cmd /k "\"%BROKER_DIR%\mosquitto_sub.exe\" -h %BROKER_HOST% -p %BROKER_PORT% -u %MQTT_USER% -P %MQTT_PASS% -t hw/feedback -v"

echo Da mo xong 5 cua so: Broker, Upload, Monitor, Sensor Sub, Feedback Sub.
echo Neu khong dung IP %BROKER_HOST%, hay sua bien BROKER_HOST trong file nay.
endlocal

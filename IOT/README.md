# Huong dan van hanh nhanh - ESP32 + MQTT + Mosquitto

## 1) Chay lai sau khi vua mo may

1. Mo broker:

```powershell
D:\Mosquitto\mosquitto.exe -c D:\Mosquitto\mosquitto.conf -v
```

2. Kiem tra broker da lang nghe cong 8000:

```powershell
netstat -ano | findstr :8000
```

3. Nap code len ESP32:

```powershell
pio run -t upload
```

4. Xem serial monitor:

```powershell
pio device monitor -b 115200
```

5. Neu thay cac dong sau la on:

- `WiFi da ket noi!`
- `Dang ket noi MQTT... Thanh cong!`

## 2) Thong so MQTT he thong

- Broker host: `192.168.144.181`
- Broker port: `8000`
- Username: `dinhvutrungduc`
- Password: `123456`
- Topic sensor: `hw/sensor`
- Topic dieu khien: `hw/control`
- Topic phan hoi: `hw/feedback`

## 3) Lenh terminal de tuong tac phan cung (theo src/main.cpp)

### 3.1 Theo doi du lieu cam bien

```powershell
D:\Mosquitto\mosquitto_sub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/sensor -v
```

Ghi chu:
- Payload moi truong gui dinh ky (Nhiet do/Do am/Anh sang).
- Motion gui theo event khi doi trang thai: `Phat hien chuyen dong` / `Ket thuc chuyen dong`.

### 3.2 Theo doi phan hoi dieu khien

```powershell
D:\Mosquitto\mosquitto_sub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/feedback -v
```

### 3.3 Dieu khien tat ca den

```powershell
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m ON
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m OFF
```

### 3.4 Dieu khien tung den

```powershell
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_TEMP:ON
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_TEMP:OFF
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_HUMID:ON
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_HUMID:OFF
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_LIGHT:ON
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m LED_LIGHT:OFF
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m PIR_LED:ON
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m PIR_LED:OFF
```

### 3.5 Chay hieu ung den

```powershell
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m ANIM:WAVE
D:\Mosquitto\mosquitto_pub.exe -h 192.168.144.181 -p 8000 -u dinhvutrungduc -P 123456 -t hw/control -m ANIM:PULSE
```

## 4) Loi thuong gap

1. `rc=-2`: Broker chua chay, sai host/port, hoac bi firewall chan.
2. Sai IP broker: can dung `192.168.144.181` (khong phai `192.168.192.181`).
3. Broker dang chay nhung ESP32 van fail: kiem tra user/pass trong `src/main.cpp` co trung voi `mosquitto.conf` + file password.
4. Backend loi `The table public.sensors does not exist`: chua migrate CSDL.

```powershell
cd ..\backend-iot
npx prisma migrate deploy
npm run dev
```

5. Backend loi `EADDRINUSE: address already in use :::3000`: cong `3000` dang bi app khac chiem.

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_TIM_DUOC> /F
cd ..\backend-iot
npm run dev
```

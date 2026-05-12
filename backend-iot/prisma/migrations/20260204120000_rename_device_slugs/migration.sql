-- Đổi tên thiết bị trong DB sang slug không trùng với cảm biến (giữ nguyên id / FK action_histories)
UPDATE devices SET name = 'fan' WHERE name IN ('temperature', 'quat');
UPDATE devices SET name = 'dehumidifier' WHERE name IN ('humidity', 'may_hut_am');
UPDATE devices SET name = 'living_room_light' WHERE name IN ('light', 'den_phong_khach');
UPDATE devices SET name = 'alarm_siren' WHERE name IN ('motion', 'bao_dong');
UPDATE devices SET name = 'aux_led' WHERE name IN ('aux', 'den_led_phu');

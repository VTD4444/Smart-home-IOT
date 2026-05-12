export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'IoT Web API',
    version: '1.1.0',
    description:
      'REST API cho dashboard IoT: snapshot hiện tại, lịch sử cảm biến, lịch sử điều khiển thiết bị, và thống kê bật/tắt theo ngày.',
  },
  tags: [
    { name: 'Dashboard', description: 'Dữ liệu realtime tổng quan' },
    { name: 'Sensors', description: 'Lịch sử dữ liệu cảm biến' },
    { name: 'DeviceActions', description: 'Lịch sử và thống kê thao tác thiết bị' },
  ],
  paths: {
    '/api/dashboard/current': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get current dashboard snapshot',
        description: 'Trả về giá trị cảm biến mới nhất, trạng thái thiết bị hiện tại và motion history để khởi tạo biểu đồ.',
        responses: {
          '200': {
            description: 'Dashboard snapshot',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardCurrentResponse' },
              },
            },
          },
        },
      },
    },
    '/api/sensors/history': {
      get: {
        tags: ['Sensors'],
        summary: 'Get sensor history with pagination',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Search' },
          { $ref: '#/components/parameters/Type' },
          { $ref: '#/components/parameters/Start' },
          { $ref: '#/components/parameters/End' },
        ],
        responses: {
          '200': {
            description: 'Paginated sensor rows',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SensorHistoryResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid query',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/device-actions/history': {
      get: {
        tags: ['DeviceActions'],
        summary: 'Get device action history with pagination',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Search' },
          { $ref: '#/components/parameters/Type' },
          { $ref: '#/components/parameters/Status' },
          { $ref: '#/components/parameters/Start' },
          { $ref: '#/components/parameters/End' },
        ],
        responses: {
          '200': {
            description: 'Paginated action rows',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeviceActionHistoryResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid query',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/device-actions/daily-stats': {
      get: {
        tags: ['DeviceActions'],
        summary: 'Get daily ON/OFF action counts for all devices',
        description:
          'Thống kê số lần bật/tắt theo ngày cho toàn bộ thiết bị trong khoảng thời gian chỉ định (mặc định 7 ngày gần nhất).',
        parameters: [
          { $ref: '#/components/parameters/StatsStart' },
          { $ref: '#/components/parameters/StatsEnd' },
        ],
        responses: {
          '200': {
            description: 'Daily chart dataset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeviceActionDailyStatsResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid query',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      Page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Trang hiện tại',
      },
      Limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        description: 'Số phần tử mỗi trang',
      },
      Search: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Từ khóa tìm kiếm (id, tên, trạng thái, timestamp...)',
      },
      Type: {
        name: 'type',
        in: 'query',
        schema: { type: 'string' },
        description: 'Tên sensor/device cần lọc',
      },
      Status: {
        name: 'status',
        in: 'query',
        schema: { type: 'string', enum: ['active', 'inactive', 'timeout'] },
        description: 'Lọc theo trạng thái action',
      },
      Start: {
        name: 'start',
        in: 'query',
        schema: { type: 'string', format: 'date-time' },
        description: 'Mốc thời gian bắt đầu (ISO datetime)',
      },
      End: {
        name: 'end',
        in: 'query',
        schema: { type: 'string', format: 'date-time' },
        description: 'Mốc thời gian kết thúc (ISO datetime)',
      },
      StatsStart: {
        name: 'start',
        in: 'query',
        schema: { type: 'string' },
        description: 'Ngày bắt đầu thống kê (ISO date hoặc datetime)',
      },
      StatsEnd: {
        name: 'end',
        in: 'query',
        schema: { type: 'string' },
        description: 'Ngày kết thúc thống kê (ISO date hoặc datetime)',
      },
    },
    schemas: {
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'object', additionalProperties: true },
        },
      },
      DashboardCurrentResponse: {
        type: 'object',
        required: ['sensorValues', 'deviceStates', 'motionHistory'],
        properties: {
          sensorValues: {
            type: 'object',
            additionalProperties: { type: 'number', nullable: true },
            example: { temperature: 29.4, humidity: 67, light: 120, motion: 0 },
          },
          deviceStates: {
            type: 'object',
            additionalProperties: { type: 'string' },
            example: {
              fan: 'inactive',
              dehumidifier: 'active',
              living_room_light: 'inactive',
              alarm_siren: 'inactive',
              aux_led: 'inactive',
            },
          },
          motionHistory: {
            type: 'array',
            items: { $ref: '#/components/schemas/MotionHistoryItem' },
          },
        },
      },
      MotionHistoryItem: {
        type: 'object',
        required: ['value', 'createdAt'],
        properties: {
          value: { type: 'number', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SensorHistoryRow: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          sensor_id: { type: 'integer' },
          value: { type: 'string', example: '29.40' },
          create_at: { type: 'string', format: 'date-time' },
          sensors: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              create_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      SensorHistoryResponse: {
        type: 'object',
        required: ['items', 'total', 'page', 'limit'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/SensorHistoryRow' },
          },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      DeviceActionHistoryRow: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          device_id: { type: 'integer' },
          action: { type: 'string', example: 'Turn On' },
          status: { type: 'string', example: 'active' },
          create_at: { type: 'string', format: 'date-time' },
          devices: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              create_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      DeviceActionHistoryResponse: {
        type: 'object',
        required: ['items', 'total', 'page', 'limit'],
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/DeviceActionHistoryRow' },
          },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      DeviceActionDailySeries: {
        type: 'object',
        required: ['device', 'on', 'off', 'total'],
        properties: {
          device: { type: 'string', example: 'aux_led' },
          on: { type: 'array', items: { type: 'integer' } },
          off: { type: 'array', items: { type: 'integer' } },
          total: { type: 'array', items: { type: 'integer' } },
        },
      },
      DeviceActionDailyStatsResponse: {
        type: 'object',
        required: ['range', 'days', 'series'],
        properties: {
          range: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
            },
          },
          days: {
            type: 'array',
            items: { type: 'string', example: '2026-04-20' },
          },
          series: {
            type: 'array',
            items: { $ref: '#/components/schemas/DeviceActionDailySeries' },
          },
        },
      },
    },
  },
} as const

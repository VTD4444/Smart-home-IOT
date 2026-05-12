<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** Unique id for SVG defs (no spaces) */
    chartUid: string
    values: number[]
    variant: 'area' | 'bar'
    lineColor: string
    fillColor: string
    badge?: string
    /** Extra bottom padding inside viewBox (viewBox units) */
    bottomPad?: number
    /** Bar chart motion: cột cao khi có chuyển động, cột thấp mỗi tick khi không (để thấy dòng thời gian) */
    motionBinary?: boolean
    /** Cùng độ dài `values`: id ổn định mỗi tick — Vue không gộp 2 cột liên tiếp cùng trạng thái */
    barKeys?: number[]
    /** Chiều cao vùng biểu đồ (px) */
    chartHeightPx?: number
    /** Đơn vị trục Y (vd: °C, %, Lux) */
    yUnit?: string
    /** Số lẻ trục Y cho số đo liên tục */
    yDecimals?: number
    /** Chu kỳ lấy mẫu để hiển thị mốc thời gian trục X */
    sampleIntervalSec?: number
    /** Ẩn tiêu đề/badge và nhãn trục — dùng trong thẻ metric nhỏ */
    compact?: boolean
  }>(),
  {
    bottomPad: 4,
    motionBinary: false,
    chartHeightPx: 400,
    yUnit: '',
    yDecimals: 0,
    sampleIntervalSec: 2,
    compact: false,
  },
)

/** Chỉ motion: giới hạn số cột hiển thị để mỗi cột đủ rộng, thấy rõ 2 tick liên tiếp */
const motionVisibleBars = 18

/** Plot area and axes in SVG viewBox units */
const plotLeft = 16
const plotRight = 174
const topPad = 10
const plotBottom = 84 - props.bottomPad
const xAxisY = 88

type ChartGeometry =
  | {
    kind: 'bar'
    bars: BarRow[]
    rawLength: number
    yTicks: { value: number; y: number; label: string }[]
  }
  | {
    kind: 'area'
    linePoints: string
    areaPoints: string
    pts: { x: number; y: number }[]
    rawLength: number
    yTicks: { value: number; y: number; label: string }[]
  }

function formatYTick(value: number) {
  const fixed = props.yDecimals > 0 ? value.toFixed(props.yDecimals) : `${Math.round(value)}`
  return props.yUnit ? `${fixed}${props.yUnit}` : fixed
}

function formatDurationAgo(secondsAgo: number) {
  if (secondsAgo <= 0) return 'Now'
  if (secondsAgo < 60) return `-${secondsAgo}s`
  const mins = Math.floor(secondsAgo / 60)
  const secs = secondsAgo % 60
  return secs > 0 ? `-${mins}m${secs}s` : `-${mins}m`
}

const xTicks = computed(() => {
  const rawLength = chartGeometry.value.rawLength
  const count = Math.max(rawLength, 1)
  const steps = [0, 0.33, 0.66, 1]
  const ticks = steps.map((ratio) => {
    const idx = Math.round(ratio * Math.max(count - 1, 0))
    const x = plotLeft + ratio * (plotRight - plotLeft)
    const secondsAgo = Math.max(count - 1 - idx, 0) * props.sampleIntervalSec
    return { x, label: formatDurationAgo(secondsAgo) }
  })
  return ticks
})

const chartGeometry = computed<ChartGeometry>(() => {
  const fullValues = props.values.length ? props.values : [0]
  const keysFull =
    props.barKeys && props.barKeys.length === fullValues.length ? props.barKeys : undefined
  const raw =
    props.variant === 'bar' && props.motionBinary
      ? fullValues.slice(-motionVisibleBars)
      : fullValues
  const keysAligned =
    props.variant === 'bar' && props.motionBinary && keysFull
      ? keysFull.slice(-motionVisibleBars)
      : keysFull
  if (props.variant === 'bar') {
    const n = raw.length
    const slot = (plotRight - plotLeft) / Math.max(n, 1)
    const barW = slot * (props.motionBinary ? 0.68 : 0.52)
    const drawable = plotBottom - topPad - 6

    if (props.motionBinary) {
      const hIdle = drawable * 0.14
      const hActive = drawable * 0.88
      const bars = raw.map((v, i) => {
        const x = plotLeft + i * slot + (slot - barW) / 2
        const active = Number(v) > 0.5
        const h = active ? hActive : hIdle
        const y = plotBottom - h
        const stableKey = keysAligned?.[i] ?? i
        return { x, y, w: barW, h, motionActive: active, stableKey }
      })
      const yTicks = [
        { value: 1, y: plotBottom - hActive, label: 'Detected' },
        { value: 0, y: plotBottom - hIdle, label: 'Clear' },
      ]
      return { kind: 'bar' as const, bars, rawLength: n, yTicks }
    }

    const maxVal = Math.max(...raw.map((v) => Math.abs(v)), 0.01)
    const bars = raw.map((v, i) => {
      const x = plotLeft + i * slot + (slot - barW) / 2
      const h = (Math.abs(v) / maxVal) * drawable * 0.72
      const y = plotBottom - h
      return { x, y, w: barW, h, show: true, stableKey: i }
    })
    const yTicks = [1, 0.66, 0.33, 0].map((r) => {
      const value = r * maxVal
      const y = plotBottom - r * drawable * 0.72
      return { value, y, label: formatYTick(value) }
    })
    return { kind: 'bar' as const, bars, rawLength: n, yTicks }
  }

  const max = Math.max(...raw, 0.0001)
  const min = Math.min(...raw, 0)
  const span = max - min || max * 0.01
  const scaleMax = max + span * 0.35
  const scaleMin = Math.min(min - span * 0.05, 0)
  const denom = scaleMax - scaleMin || 1

  const pts = raw.map((v, i) => {
    const x =
      raw.length === 1
        ? plotLeft + (plotRight - plotLeft) / 2
        : plotLeft + (i / Math.max(raw.length - 1, 1)) * (plotRight - plotLeft)
    const t = (v - scaleMin) / denom
    const y = plotBottom - t * (plotBottom - topPad)
    return { x, y }
  })

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  const areaPoints = `${first.x},${plotBottom} ${linePoints} ${last.x},${plotBottom}`

  const yTicks = [1, 0.66, 0.33, 0].map((r) => {
    const value = scaleMin + (scaleMax - scaleMin) * r
    const y = plotBottom - r * (plotBottom - topPad)
    return { value, y, label: formatYTick(value) }
  })

  return { kind: 'area' as const, linePoints, areaPoints, pts, rawLength: raw.length, yTicks }
})

type BarRow = {
  x: number
  y: number
  w: number
  h: number
  motionActive?: boolean
  show?: boolean
  stableKey: number
}

function barFill(b: BarRow) {
  if (props.motionBinary && b.motionActive === false) return '#b39ddb'
  return props.lineColor
}

function barMotionClass(b: BarRow) {
  if (!props.motionBinary) return ''
  return b.motionActive ? 'bar-rect--motion-on' : 'bar-rect--motion-idle'
}
</script>

<template>
  <article class="chart-card" :class="{ 'chart-card--compact': compact }">
    <div v-if="!compact" class="chart-head">
      <h4 class="chart-title">{{ title }}</h4>
      <span v-if="badge" class="chart-badge">{{ badge }}</span>
    </div>
    <div class="chart-surface" :class="{ 'chart-surface--compact-fill': compact }"
      :style="{ minHeight: `${chartHeightPx}px` }">
      <svg class="chart-svg" :class="{ 'chart-svg--compact-fill': compact }"
        :style="compact ? undefined : { height: `${chartHeightPx}px` }" viewBox="0 0 180 100"
        preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <line v-for="tick in chartGeometry.yTicks" :key="`grid-${tick.y}`" :x1="plotLeft" :y1="tick.y" :x2="plotRight"
          :y2="tick.y" class="grid-line" />
        <line :x1="plotLeft" :y1="xAxisY" :x2="plotRight" :y2="xAxisY" class="axis-line" />
        <defs>
          <linearGradient :id="`grad-${chartUid}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="lineColor" stop-opacity="0.35" />
            <stop offset="100%" :stop-color="lineColor" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <template v-if="chartGeometry.kind === 'area'">
          <polygon :points="chartGeometry.areaPoints" :fill="`url(#grad-${chartUid})`" class="area-fill" />
          <polyline :points="chartGeometry.linePoints" fill="none" :stroke="lineColor" stroke-width="1.2"
            vector-effect="non-scaling-stroke" class="line-path" stroke-linecap="round" stroke-linejoin="round" />
        </template>
        <template v-else>
          <rect v-for="(b, i) in chartGeometry.bars" :key="b.stableKey" :x="b.x" :y="b.y" :width="b.w" :height="b.h"
            :fill="barFill(b)" rx="1" :class="['bar-rect', barMotionClass(b)]"
            :style="{ animationDelay: `${i * 40}ms` }" />
        </template>
        <text v-for="tick in chartGeometry.yTicks" :key="`yt-${tick.y}`" :x="1.8" :y="tick.y + 1"
          :class="['axis-text', 'axis-text--y', { 'axis-text--compact': compact }]">
          {{ tick.label }}
        </text>
        <text v-for="tick in xTicks" :key="`xt-${tick.x}`" :x="tick.x" :y="96" text-anchor="middle"
          :class="['axis-text', 'axis-text--x', { 'axis-text--compact': compact }]">
          {{ tick.label }}
        </text>
      </svg>
    </div>
  </article>
</template>

<style scoped>
.chart-card {
  padding: 14px 14px 14px;
  min-height: 0;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 14px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef2f7;
}

.chart-card--compact {
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.chart-surface--compact-fill {
  flex: 1;
  min-height: 0;
  position: relative;
}

.chart-svg--compact-fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 0 0 14px 14px;
}

.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.chart-badge {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 8px;
}

.chart-surface {
  position: relative;
}

.chart-svg {
  display: block;
  width: 100%;
  background: linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%);
  border-radius: 12px;
  overflow: hidden;
}

.grid-line {
  stroke: #e5e7eb;
  stroke-width: 0.35;
  stroke-dasharray: 1.2 1.6;
}

.axis-line {
  stroke: #cbd5e1;
  stroke-width: 0.5;
}

.axis-text {
  fill: #6b7280;
  font-size: 4px;
  font-weight: 600;
  user-select: none;
}

.axis-text--compact {
  fill: #475569;
  font-size: 4px;
  font-weight: 700;
}

.axis-text--y {
  text-anchor: start;
}

.area-fill {
  animation: fadeArea 0.8s ease-out forwards;
}

/* SVG <rect>: không dùng transform scaleY (dễ lỗi với preserveAspectRatio="none"); luôn hiển thị rõ */
.bar-rect {
  opacity: 1;
}

.bar-rect--motion-idle {
  opacity: 0.7;
}

.bar-rect--motion-on {
  opacity: 0.95;
}

@keyframes fadeArea {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>

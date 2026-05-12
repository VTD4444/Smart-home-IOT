<script setup lang="ts">
import DashboardChartCard from '@/components/charts/DashboardChartCard.vue'
import type { SensorId } from '@/stores/iot'

defineProps<{
  title: string
  location: string
  valueText: string
  icon: 'thermo' | 'drop' | 'sun' | 'motion'
  line: string
  fill: string
  soft: string
  border: string
  chartUid: SensorId
  chartValues: number[]
  chartVariant: 'area' | 'bar'
  chartHeightPx: number
  yUnit: string
  yDecimals: number
  motionBinary?: boolean
  barKeys?: number[]
}>()
</script>

<template>
  <article
    class="metric-hero"
    :style="{
      '--m-line': line,
      '--m-fill': fill,
      '--m-soft': soft,
      '--m-border': border,
    }"
  >
    <div class="metric-hero__top">
      <div class="metric-hero__labels">
        <p class="metric-hero__title">{{ title }}</p>
        <p class="metric-hero__loc">{{ location }}</p>
      </div>
      <div class="metric-hero__icon" :class="`metric-hero__icon--${icon}`">
        <svg v-if="icon === 'thermo'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M12 2v8" stroke-linecap="round" />
          <path d="M9 18h6" stroke-linecap="round" />
        </svg>
        <svg v-else-if="icon === 'sun'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else-if="icon === 'motion'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 12h4l2-6 4 12 2-6h4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 3c-3 4-6 7-6 10a6 6 0 0 0 12 0c0-3-3-6-6-10Z" />
          <path d="M12 13v6" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    <p class="metric-hero__value">{{ valueText }}</p>
    <div class="metric-hero__chart">
      <DashboardChartCard
        :title="title"
        :chart-uid="chartUid"
        :values="chartValues"
        :variant="chartVariant"
        :line-color="line"
        :fill-color="fill"
        :motion-binary="Boolean(motionBinary)"
        :bar-keys="barKeys"
        :chart-height-px="chartHeightPx"
        :y-unit="yUnit"
        :y-decimals="yDecimals"
        :sample-interval-sec="2"
        compact
      />
    </div>
  </article>
</template>

<style scoped>
.metric-hero {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #eef2f7;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.07);
  overflow: hidden;
  transition:
    box-shadow 0.25s ease,
    transform 0.2s ease;
}
.metric-hero:hover {
  box-shadow: 0 10px 32px rgba(15, 23, 42, 0.09);
}
.metric-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 16px 0;
}
.metric-hero__labels {
  min-width: 0;
}
.metric-hero__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.02em;
}
.metric-hero__loc {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}
.metric-hero__icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--m-line);
  background: linear-gradient(145deg, var(--m-soft), #fff);
  border: 1px solid #e8ecf2;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}
.metric-hero__icon svg {
  width: 22px;
  height: 22px;
}
.metric-hero__value {
  margin: 10px 16px 0;
  font-size: clamp(26px, 3.2vw, 34px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.05;
}
.metric-hero__chart {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>

<template>
  <section class="page-frame profile-page">
    <header class="head">
      <h1 class="page-title">Profile</h1>
      <p class="page-subtitle">Personal information and project quick links</p>
    </header>

    <article class="card profile-hero">
      <div class="profile-hero__media">
        <img src="/DVTDuc.jpg" alt="Dinh Vu Trung Duc" class="profile-photo" />
      </div>
      <div class="profile-hero__content">
        <p class="badge">IoT Portfolio</p>
        <h2 class="profile-name">Dinh Vu Trung Duc</h2>
        <p class="profile-role">IoT Project Developer</p>
        <p class="profile-bio">
          Building reliable end-to-end IoT systems from ESP32 firmware to MQTT bridge, backend services, and realtime
          web dashboard.
        </p>
        <div class="profile-meta">
          <span class="meta-chip">ESP32 + MQTT</span>
          <span class="meta-chip">Node.js + Prisma</span>
          <span class="meta-chip">Vue 3 + Pinia</span>
        </div>
      </div>
    </article>

    <div class="links">
      <a class="card link" href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
        <p class="link__title">API Documentation</p>
        <p class="link__desc">Swagger UI for backend endpoints and payload contracts.</p>
      </a>
      <a class="card link" href="https://github.com/VTD4444/Smart-home-IOT.git" target="_blank" rel="noreferrer">
        <p class="link__title">Github Repository</p>
        <p class="link__desc">Source code for firmware, backend, and frontend modules.</p>
      </a>
      <a class="card link"
        href="https://www.figma.com/design/hRmEAjxsUQRo9d7tqOefbW/IOT?node-id=0-1&t=QaL3mcD5IXTniksg-1" target="_blank"
        rel="noreferrer">
        <p class="link__title">Figma Design</p>
        <p class="link__desc">UI references, component sketches, and dashboard layout ideas.</p>
      </a>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  min-height: 0;
}

.head {
  flex-shrink: 0;
}

.profile-hero {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 18px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background:
    radial-gradient(120% 120% at 100% 0%, #dbeafe 0%, rgba(219, 234, 254, 0) 50%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.profile-hero__media {
  min-height: 0;
}

.profile-photo {
  width: 100%;
  height: 220px;
  object-fit: cover;
  object-position: center 20%;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 26px rgba(30, 64, 175, 0.18);
}

.profile-hero__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.badge {
  margin: 0;
  width: fit-content;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 4px 10px;
}

.profile-name {
  margin: 10px 0 2px;
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.profile-role {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.profile-bio {
  margin: 10px 0 0;
  max-width: 68ch;
  font-size: 13px;
  line-height: 1.55;
  color: #475569;
}

.profile-meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.links {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.link {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.link:hover {
  transform: translateY(-1px);
  border-color: #bfdbfe;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.link__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
}

.link__desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

@media (max-width: 720px) {
  .profile-hero {
    grid-template-columns: 1fr;
  }

  .profile-photo {
    height: 180px;
  }

  .links {
    grid-template-columns: 1fr;
  }
}
</style>

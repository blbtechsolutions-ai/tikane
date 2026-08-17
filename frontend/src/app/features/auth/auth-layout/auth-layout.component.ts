import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-screen">
      <section class="auth-art" aria-hidden="true">
        <!-- Floating glowing orbs for premium UX visual depth -->
        <div class="glow-orb glow-orb--1"></div>
        <div class="glow-orb glow-orb--2"></div>
        <div class="glow-orb glow-orb--3"></div>
        <svg
          class="auth-art__svg"
          viewBox="0 0 760 820"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="auth-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0b0a24" />
              <stop offset="42%" stop-color="#120e3a" />
              <stop offset="78%" stop-color="#191054" />
              <stop offset="100%" stop-color="#2d1259" />
            </linearGradient>
            <radialGradient id="top-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform="translate(508 112) rotate(84.81) scale(286 232)">
              <stop offset="0%" stop-color="#ffd8f1" stop-opacity="0.95" />
              <stop offset="52%" stop-color="#f6b9e6" stop-opacity="0.52" />
              <stop offset="100%" stop-color="#f6b9e6" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="core-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform="translate(360 385) rotate(90) scale(204 198)">
              <stop offset="0%" stop-color="#ffe6f7" stop-opacity="0.84" />
              <stop offset="33%" stop-color="#c2c7ff" stop-opacity="0.66" />
              <stop offset="68%" stop-color="#89b9ff" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#89b9ff" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="bottom-blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform="translate(168 716) rotate(69.72) scale(214 186)">
              <stop offset="0%" stop-color="#abd2ff" stop-opacity="0.88" />
              <stop offset="54%" stop-color="#7fb8ff" stop-opacity="0.26" />
              <stop offset="100%" stop-color="#7fb8ff" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="glass-fill" x1="130" y1="88" x2="620" y2="650" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24" />
              <stop offset="38%" stop-color="#d6dbff" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#adc4ff" stop-opacity="0.08" />
            </linearGradient>
            <linearGradient id="glass-stroke" x1="176" y1="112" x2="548" y2="612" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#f6efff" stop-opacity="0.9" />
              <stop offset="45%" stop-color="#c2d8ff" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#d8cdfc" stop-opacity="0.52" />
            </linearGradient>
            <linearGradient id="prism-purple" x1="440" y1="507" x2="576" y2="731" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#f9d5ff" stop-opacity="0.62" />
              <stop offset="48%" stop-color="#8c72ff" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#4e1fd3" stop-opacity="0.76" />
            </linearGradient>
            <linearGradient id="prism-blue" x1="78" y1="160" x2="214" y2="330" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fce3ff" stop-opacity="0.62" />
              <stop offset="44%" stop-color="#a3b5ff" stop-opacity="0.48" />
              <stop offset="100%" stop-color="#5e55f1" stop-opacity="0.72" />
            </linearGradient>
            <linearGradient id="orb-ring" x1="28" y1="523" x2="241" y2="706" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ecf3ff" stop-opacity="0.7" />
              <stop offset="42%" stop-color="#b8c6ff" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#8ab0ff" stop-opacity="0.12" />
            </linearGradient>
            <linearGradient id="logo-neon-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00f0ff" />
              <stop offset="100%" stop-color="#0052ff" />
            </linearGradient>
            <linearGradient id="logo-white-highlight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
              <stop offset="40%" stop-color="#ffffff" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.1" />
            </linearGradient>
            <linearGradient id="glass-lobe-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.22" />
              <stop offset="50%" stop-color="#0052ff" stop-opacity="0.06" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
            </linearGradient>
            <radialGradient id="logo-radial-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.35" />
              <stop offset="60%" stop-color="#0052ff" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.45" />
              <stop offset="50%" stop-color="#0066ff" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0" />
            </radialGradient>
            <filter id="scene-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="44" />
            </filter>
            <filter id="panel-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="24" stdDeviation="34" flood-color="#0b0c2f" flood-opacity="0.34" />
            </filter>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0f103f" flood-opacity="0.26" />
            </filter>
            <filter id="neon-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="orb-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
            <clipPath id="core-hex">
              <path d="M364 182L563 296V524L364 638L165 524V296L364 182Z" />
            </clipPath>
          </defs>

          <rect width="760" height="820" fill="url(#auth-bg)" />
          <circle cx="520" cy="112" r="234" fill="url(#top-glow)" filter="url(#scene-blur)" />
          <circle cx="162" cy="712" r="186" fill="url(#bottom-blue)" filter="url(#scene-blur)" />
          <circle cx="617" cy="466" r="138" fill="#7783ff" fill-opacity="0.16" filter="url(#scene-blur)" />

          <g filter="url(#soft-shadow)">
            <path
              d="M92 204L173 112L240 184L159 275L92 204Z"
              fill="url(#prism-blue)"
              stroke="rgba(255,255,255,0.55)"
              stroke-width="3"
            />
            <path
              d="M172 112L242 164L240 184L173 112Z"
              fill="#dfe7ff"
              fill-opacity="0.42"
            />
            <path
              d="M438 118L498 80L559 126L540 198L470 220L422 171L438 118Z"
              fill="url(#glass-fill)"
              stroke="rgba(255,255,255,0.6)"
              stroke-width="2.4"
            />
            <path
              d="M470 220L540 198L527 260L466 278L470 220Z"
              fill="#acd8ff"
              fill-opacity="0.26"
            />
            <path
              d="M470 82L530 122L497 144L438 118L470 82Z"
              fill="#dff1ff"
              fill-opacity="0.28"
            />
          </g>

          <g filter="url(#panel-shadow)">
            <path
              d="M118 140C118 128 128 118 140 118H332C344 118 354 128 354 140V494C354 506 344 516 332 516H140C128 516 118 506 118 494V140Z"
              fill="url(#glass-fill)"
              fill-opacity="0.18"
              stroke="url(#glass-stroke)"
              stroke-width="2.2"
            />
            <path
              d="M343 258C343 245 353 235 366 235H594C607 235 617 245 617 258V547C617 560 607 570 594 570H366C353 570 343 560 343 547V258Z"
              fill="url(#glass-fill)"
              fill-opacity="0.14"
              stroke="url(#glass-stroke)"
              stroke-width="2.2"
            />
            <path
              d="M186 238L364 138L542 238V534L364 634L186 534V238Z"
              fill="url(#glass-fill)"
              fill-opacity="0.22"
              stroke="url(#glass-stroke)"
              stroke-width="2.8"
            />
            <path
              d="M121 158L322 41L522 158V418L322 535L121 418V158Z"
              fill="url(#glass-fill)"
              fill-opacity="0.08"
              stroke="url(#glass-stroke)"
              stroke-opacity="0.64"
              stroke-width="2.2"
            />
            <path
              d="M208 254L408 137L609 254V514L408 631L208 514V254Z"
              fill="url(#glass-fill)"
              fill-opacity="0.06"
              stroke="url(#glass-stroke)"
              stroke-opacity="0.54"
              stroke-width="2.2"
            />
          </g>

          <g clip-path="url(#core-hex)">
            <circle cx="361" cy="389" r="174" fill="url(#core-glow)" filter="url(#orb-blur)" />
            <circle cx="314" cy="360" r="44" fill="#d0f2ff" fill-opacity="0.22" filter="url(#orb-blur)" />
            <circle cx="422" cy="427" r="58" fill="#ffcae8" fill-opacity="0.18" filter="url(#orb-blur)" />
          </g>

          <g filter="url(#soft-shadow)">
            <path
              d="M177 552L250 468L322 521L305 650L190 641L177 552Z"
              fill="url(#glass-fill)"
              fill-opacity="0.24"
              stroke="rgba(255,255,255,0.46)"
              stroke-width="2"
            />
            <path
              d="M438 534L552 490L604 586L544 706L434 642L438 534Z"
              fill="url(#prism-purple)"
              stroke="rgba(255,255,255,0.38)"
              stroke-width="2.2"
            />
            <path d="M438 534L544 706L490 646L438 534Z" fill="#a673ff" fill-opacity="0.3" />
            <path d="M552 490L604 586L546 575L552 490Z" fill="#ffcfff" fill-opacity="0.18" />
          </g>

          <circle cx="96" cy="612" r="104" stroke="url(#orb-ring)" stroke-width="70" fill="none" filter="url(#soft-shadow)" />
          <circle cx="110" cy="387" r="22" fill="#d7eaff" fill-opacity="0.7" filter="url(#orb-blur)" />
          <circle cx="404" cy="742" r="62" fill="#9cb6ff" fill-opacity="0.22" filter="url(#soft-shadow)" />

          <!-- Ambient backlighting for the premium 3D Glassmorphic BLBTECH Logo -->
          <circle cx="364" cy="400" r="160" fill="url(#neon-glow)" filter="url(#orb-blur)" />

          <!-- Stylized 3D Glassmorphic BLBTECH Logo -->
          <g filter="url(#soft-shadow)">
            <!-- Outer circular ring with top gap (dasharray) -->
            <circle
              cx="364"
              cy="400"
              r="76"
              fill="none"
              stroke="url(#logo-neon-gradient)"
              stroke-width="6.5"
              stroke-linecap="round"
              stroke-dasharray="358 117"
              transform="rotate(-90 364 400)"
              filter="url(#neon-glow-filter)"
            />
            <circle
              cx="364"
              cy="400"
              r="76"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-dasharray="358 117"
              transform="rotate(-90 364 400)"
            />

            <!-- Central Column/Stem -->
            <rect
              x="360"
              y="342"
              width="8"
              height="116"
              rx="4"
              fill="url(#logo-neon-gradient)"
              filter="url(#neon-glow-filter)"
            />
            <rect
              x="361.5"
              y="343.5"
              width="5"
              height="113"
              rx="2.5"
              fill="url(#logo-white-highlight)"
            />

            <!-- Left Lobes (Mirrored B) -->
            <!-- Top Left Loop -->
            <path
              d="M 364 345 C 314 345 314 400 364 400"
              fill="url(#glass-lobe-fill)"
              stroke="url(#logo-neon-gradient)"
              stroke-width="6"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 364 345 C 314 345 314 400 364 400"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2.2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Bottom Left Loop -->
            <path
              d="M 364 400 C 310 400 310 455 364 455"
              fill="url(#glass-lobe-fill)"
              stroke="url(#logo-neon-gradient)"
              stroke-width="6"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 364 400 C 310 400 310 455 364 455"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2.2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <!-- Right Lobes (Regular B) -->
            <!-- Top Right Loop -->
            <path
              d="M 364 345 C 414 345 414 400 364 400"
              fill="url(#glass-lobe-fill)"
              stroke="url(#logo-neon-gradient)"
              stroke-width="6"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 364 345 C 414 345 414 400 364 400"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2.2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Bottom Right Loop -->
            <path
              d="M 364 400 C 418 400 418 455 364 455"
              fill="url(#glass-lobe-fill)"
              stroke="url(#logo-neon-gradient)"
              stroke-width="6"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 364 400 C 418 400 418 455 364 455"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2.2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <!-- WiFi-like Antenna Waves -->
            <!-- Wave 1 (Inner) -->
            <path
              d="M 350.1 334 A 16 16 0 0 1 377.9 334"
              fill="none"
              stroke="url(#logo-neon-gradient)"
              stroke-width="5"
              stroke-linecap="round"
              filter="url(#neon-glow-filter)"
            />
            <path
              d="M 350.1 334 A 16 16 0 0 1 377.9 334"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <!-- Wave 2 (Middle) -->
            <path
              d="M 339.7 326 A 28 28 0 0 1 388.3 326"
              fill="none"
              stroke="url(#logo-neon-gradient)"
              stroke-width="5"
              stroke-linecap="round"
              filter="url(#neon-glow-filter)"
            />
            <path
              d="M 339.7 326 A 28 28 0 0 1 388.3 326"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <!-- Wave 3 (Outer) -->
            <path
              d="M 329.3 318 A 40 40 0 0 1 398.7 318"
              fill="none"
              stroke="url(#logo-neon-gradient)"
              stroke-width="5"
              stroke-linecap="round"
              filter="url(#neon-glow-filter)"
            />
            <path
              d="M 329.3 318 A 40 40 0 0 1 398.7 318"
              fill="none"
              stroke="url(#logo-white-highlight)"
              stroke-width="2"
              stroke-linecap="round"
            />
          </g>
        </svg>
      </section>

      <section class="auth-form-side">
        <div class="auth-form-wrap">
          <router-outlet />
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .auth-screen {
        height: 100vh;
        display: grid;
        grid-template-columns: 1fr 1fr;
        overflow: hidden;
        background: #f7f8fb;
      }

      .auth-art {
        position: relative;
        overflow: hidden;
        min-width: 0;
        height: 100vh;
        background: radial-gradient(circle at 30% 20%, #130f3a 0%, #0a0720 50%, #03030f 100%);
      }

      .glow-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 0;
      }

      .glow-orb--1 {
        top: -10%;
        right: -10%;
        width: 380px;
        height: 380px;
        background: radial-gradient(circle, #ff9beb 0%, rgba(255,155,235,0) 70%);
        opacity: 0.35;
      }

      .glow-orb--2 {
        bottom: -5%;
        left: -5%;
        width: 420px;
        height: 420px;
        background: radial-gradient(circle, #00f0ff 0%, rgba(0,240,255,0) 70%);
        opacity: 0.38;
      }

      .glow-orb--3 {
        top: 35%;
        left: 25%;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, #6366f1 0%, rgba(99,102,241,0) 70%);
        opacity: 0.28;
      }

      .auth-art__svg {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        transform: none;
        z-index: 1;
      }

      .auth-form-side {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        height: 100vh;
        background: #f7f8fb;
      }

      .auth-form-wrap {
        width: 100%;
        max-width: 534px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 38px 56px;
      }

      @media (max-width: 1100px) {
        .auth-screen {
          grid-template-columns: 1fr;
          grid-template-rows: 38vh minmax(0, 1fr);
          height: 100dvh;
        }

        .auth-art {
          display: block;
          height: 100%;
          min-height: 0;
        }

        .auth-form-side {
          height: auto;
          min-height: 0;
        }

        .auth-form-wrap {
          max-width: none;
          align-items: flex-start;
          padding: 34px 28px 30px;
        }
      }

      @media (max-width: 640px) {
        .auth-screen {
          grid-template-rows: 36vh minmax(0, 1fr);
        }

        .auth-art__svg {
          transform: none;
        }

        .auth-form-wrap {
          padding: 28px 22px 24px;
        }
      }
    `,
  ],
})
export class AuthLayoutComponent {}

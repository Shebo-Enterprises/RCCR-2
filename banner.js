(function() {
    // Inject CSS
    const css = `
        .rccr-banner-root {
            background-color: #f0f0f0;
            border-bottom: 1px solid #d1d5db;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1b1b1b;
            width: 100%;
            box-sizing: border-box;
        }
        .rccr-banner-root *, .rccr-banner-root *::before, .rccr-banner-root *::after {
            box-sizing: border-box;
        }
        .rccr-max-w {
            max-width: 80rem;
            margin-left: auto;
            margin-right: auto;
            padding-left: 1rem;
            padding-right: 1rem;
        }
        .rccr-header {
            display: flex;
            align-items: center;
            padding-top: 0.375rem;
            padding-bottom: 0.375rem;
            flex-wrap: wrap;
        }
        .rccr-logo-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .rccr-crest {
            width: 1rem;
            height: 1rem;
        }
        .rccr-text-small {
            font-size: 11px;
            line-height: 1;
        }
        @media (min-width: 640px) {
            .rccr-text-small {
                font-size: 0.75rem; /* xs */
            }
        }
        .rccr-font-bold {
            font-weight: 700;
        }
        .rccr-toggle-btn {
            margin-left: 0.75rem;
            font-size: 11px;
            color: #005ea2;
            text-decoration: underline;
            display: flex;
            align-items: center;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            font-family: inherit;
        }
        @media (min-width: 640px) {
            .rccr-toggle-btn {
                font-size: 0.75rem;
            }
        }
        .rccr-toggle-btn:hover {
            color: #1a4480;
        }
        .rccr-arrow {
            margin-left: 0.25rem;
            width: 0.75rem;
            height: 0.75rem;
            transition: transform 0.2s ease;
        }
        .rccr-arrow.rotated {
            transform: rotate(180deg);
        }
        .rccr-details {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            border-top: 1px solid #d1d5db;
        }
        .rccr-details.expanded {
            max-height: 500px;
        }
        .rccr-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
        }
        @media (min-width: 768px) {
            .rccr-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .rccr-item {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
        }
        .rccr-icon-lg {
            width: 2.5rem;
            height: 2.5rem;
            color: #6b7280;
            flex-shrink: 0;
        }
        .rccr-h3 {
            font-weight: 700;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            margin-top: 0;
            color: #1b1b1b;
        }
        .rccr-p {
            font-size: 0.75rem;
            color: #4b5563;
            line-height: 1.625;
            margin: 0;
        }
        .rccr-lock {
            display: inline-block;
            background-color: #e5e7eb;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
            border-radius: 0.25rem;
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Inject HTML
    const bannerSection = document.createElement('section');
    bannerSection.className = 'rccr-banner-root';
    bannerSection.id = 'rccr-official-banner';
    
    bannerSection.innerHTML = `
    <div class="rccr-max-w">
        <div class="rccr-header">
            <div class="rccr-logo-group">
                <svg class="rccr-crest" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 5V11C4 16.09 7.41 20.85 12 22C16.59 20.85 20 16.09 20 11V5L12 2Z" fill="#002868"/>
                    <path d="M12 5V19C14.75 18.06 17.06 15.93 18.25 13.12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p class="rccr-text-small">
                    An official website of the <span class="rccr-font-bold">RCCR</span>
                </p>
            </div>
            
            <button id="rccr-toggle-btn" class="rccr-toggle-btn" aria-expanded="false">
                Here's how you know
                <svg id="rccr-arrow" class="rccr-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
        </div>

        <div id="rccr-details" class="rccr-details">
            <div class="rccr-grid">
                <div class="rccr-item">
                    <div class="rccr-icon-wrapper">
                        <svg class="rccr-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="rccr-h3">Official websites use .rebchardle.org</h3>
                        <p class="rccr-p">
                            A <strong>.rebchardle.org</strong> website belongs to an official organization within the RCCR network. 
                            Before sharing sensitive information, make sure you're on a <strong>.rebchardle.org</strong> site.
                        </p>
                    </div>
                </div>

                <div class="rccr-item">
                    <div class="rccr-icon-wrapper">
                        <svg class="rccr-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="rccr-h3">Secure .rebchardle.org websites use HTTPS</h3>
                        <p class="rccr-p">
                            A <strong>lock</strong> ( <span class="rccr-lock">🔒</span> ) or <strong>https://</strong> means you've safely connected to the official website. 
                            Only share sensitive information on secure, encrypted sites.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Insert as first child of body
    if (document.body) {
        document.body.insertBefore(bannerSection, document.body.firstChild);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.insertBefore(bannerSection, document.body.firstChild);
        });
    }

    // Logic
    const btn = bannerSection.querySelector('#rccr-toggle-btn');
    const details = bannerSection.querySelector('#rccr-details');
    const arrow = bannerSection.querySelector('#rccr-arrow');

    btn.addEventListener('click', () => {
        const isExpanded = details.classList.contains('expanded');
        if (isExpanded) {
            details.classList.remove('expanded');
            arrow.classList.remove('rotated');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            details.classList.add('expanded');
            arrow.classList.add('rotated');
            btn.setAttribute('aria-expanded', 'true');
        }
    });
})();
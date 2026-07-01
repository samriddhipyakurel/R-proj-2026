// ============================================
// TrendSeer – Fashion AI Prediction Platform
// JavaScript – Interactions & Animations
// ============================================

// ── Navigation ──
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Active link highlight on scroll
const sections = document.querySelectorAll('section, footer');
const navAnchors = navLinks.querySelectorAll('a:not(.nav-cta)');

function updateActiveLink() {
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 140;
    if (window.scrollY >= top) current = sec.getAttribute('id');
  });
  navAnchors.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
}
window.addEventListener('scroll', updateActiveLink);

// Navbar background on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.background = 'rgba(255,255,255,0.8)';
    navbar.style.boxShadow = '0 4px 30px rgba(228,140,164,0.15), 0 1px 3px rgba(0,0,0,0.06)';
  } else {
    navbar.style.background = 'rgba(255,255,255,0.55)';
    navbar.style.boxShadow = '0 4px 30px rgba(228,140,164,0.12), 0 1px 3px rgba(0,0,0,0.04)';
  }
});

// ── Scroll Reveal ──
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

// ── Prediction Category Cards ──
const predictCards = document.querySelectorAll('.predict-card');
predictCards.forEach(card => {
  card.addEventListener('click', () => {
    predictCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

// ── Gender Cards – Expand / Collapse ──
const genderCards = document.querySelectorAll('.gender-card');
genderCards.forEach(card => {
  const header = card.querySelector('.gender-card-header');
  const moreTags = card.querySelectorAll('.more-tag');

  const toggleExpand = () => {
    card.classList.toggle('expanded');
    const moreTag = card.querySelector('.more-tag');
    if (card.classList.contains('expanded')) {
      moreTag.textContent = 'Show less';
    } else {
      const gender = card.dataset.gender;
      moreTag.textContent = gender === 'female' ? '+5 more' : '+4 more';
    }
  };

  header.addEventListener('click', toggleExpand);
  moreTags.forEach(t => t.addEventListener('click', toggleExpand));
});

// ── Select items from Gender cards ──
const allItems = document.querySelectorAll('.expanded-item, .gender-tag:not(.more-tag)');
allItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const productName = item.dataset.item;
    if (!productName) return;

    // Update selected product display
    document.getElementById('selected-product-name').textContent = productName;
    document.getElementById('pred-product').textContent = productName;

    // Determine gender
    const card = item.closest('.gender-card');
    if (card) {
      const gender = card.dataset.gender;
      const catLabel = gender === 'female' ? 'Female Fashion' : 'Male Fashion';
      document.getElementById('selected-product-category').textContent = catLabel;
      document.getElementById('pred-category').textContent = catLabel;
    }

    // Update icon
    const iconMap = {
      'Dresses': '👗', 'Skirts': '🩱', 'Jeans': '👖', 'Shirts': '👔',
      'Hoodies': '🧥', 'Jackets': '🧥', 'Sneakers': '👟', 'Accessories': '👜',
      'High Heels': '👠', 'T-Shirts': '👕', 'Shorts': '🩳'
    };
    const icon = iconMap[productName] || '🛍️';
    document.querySelector('.product-selected-icon').textContent = icon;

    // Highlight selected item
    document.querySelectorAll('.expanded-item').forEach(i => i.classList.remove('selected'));
    if (item.classList.contains('expanded-item')) item.classList.add('selected');

    // Scroll to product section
    setTimeout(() => {
      document.getElementById('product-section').scrollIntoView({ behavior: 'smooth' });
    }, 300);
  });
});

// ── Price Range Slider ──
const priceRange = document.getElementById('price-range');
const rangeDisplay = document.getElementById('range-display');
const predPrice = document.getElementById('pred-price');

priceRange.addEventListener('input', () => {
  const val = priceRange.value;
  rangeDisplay.textContent = `Up to $${val}`;
  predPrice.textContent = `Up to $${val}`;
});

// ── Prediction ──
async function runPrediction() {
  const btn = document.getElementById('btn-predict');
  const results = document.getElementById('results-panel');

  btn.classList.add('loading');
  results.classList.remove('visible');

  // Gather data from the UI to send to our R Backend
  const payload = {
    price_usd: document.getElementById('price-range').value,
    brand: document.getElementById('brand-pref').value || "Other",
    individual_category: document.getElementById('selected-product-name').textContent,
    // Extract "Women" or "Men" based on the selected category card
    gender: document.getElementById('selected-product-category').textContent.includes("Female") ? "Women" : "Men",
    source_market: "US"
  };

  try {
    // Make an HTTP POST request to the Plumber API running locally on port 8000
    const response = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to fetch from API');
    
    // Parse the JSON response from R
    const data = await response.json();
    
    // R Plumber usually returns single values as an array, e.g., [0.85]
    const isTrending = data.prediction[0] === 1;
    const confidenceScore = Math.round(data.confidence[0] * 100);

    // Update the UI with the REAL confidence score from the Random Forest!
    document.getElementById('res-confidence').innerHTML = `${confidenceScore}<span class="unit">%</span>`;
    document.getElementById('prog-confidence').style.width = confidenceScore + '%';

    // (Demand score is still calculated visually for effect)
    const demand = isTrending ? Math.floor(Math.random() * 10) + 88 : Math.floor(Math.random() * 20) + 40;
    document.getElementById('res-demand').innerHTML = `${demand}<span class="unit">/100</span>`;
    document.getElementById('prog-demand').style.width = demand + '%';

    // Update Trend direction based on the true prediction
    const dir = document.getElementById('trend-direction');
    if (isTrending || confidenceScore > 50) {
      dir.textContent = '↑ Trending Up';
      dir.className = 'trend-indicator trend-up';
      document.getElementById('res-popularity').textContent = 'Rising';
    } else {
      dir.textContent = '→ Stable';
      dir.className = 'trend-indicator trend-stable';
      document.getElementById('res-popularity').textContent = 'Stable';
    }

    // Mini chart (visual flair)
    const chart = document.getElementById('mini-chart');
    chart.innerHTML = '';
    const colors = ['var(--pink-200)', 'var(--pink-300)', 'var(--sage-200)', 'var(--pink-400)', 'var(--sage-300)', 'var(--pink-300)', 'var(--sage-400)', 'var(--pink-500)'];
    for (let i = 0; i < 8; i++) {
      const bar = document.createElement('div');
      bar.className = 'mini-chart-bar';
      const h = Math.floor(Math.random() * 40) + 20;
      bar.style.height = h + 'px';
      bar.style.background = colors[i];
      bar.style.animationDelay = (i * 0.1) + 's';
      chart.appendChild(bar);
    }

    // Audience (visual flair)
    const audiences = [
      { label: 'Gen Z & Millennials', tags: ['Ages 18-34', 'Streetwear Lovers', 'Trend Setters', 'Social Media Active'] },
      { label: 'Fashion Enthusiasts', tags: ['Ages 20-40', 'Style Conscious', 'Brand Loyal', 'Early Adopters'] },
      { label: 'Young Professionals', tags: ['Ages 25-40', 'Urban Dwellers', 'Quality Seekers', 'Minimalists'] },
    ];
    const pick = audiences[Math.floor(Math.random() * audiences.length)];
    document.getElementById('res-audience-label').textContent = pick.label;
    const tagsEl = document.getElementById('audience-tags');
    tagsEl.innerHTML = '';
    pick.tags.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'audience-tag' + (i % 2 === 1 ? ' green' : '');
      span.textContent = t;
      tagsEl.appendChild(span);
    });

    // Show results
    btn.classList.remove('loading');
    results.classList.add('visible');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Re-trigger progress bar animations
    document.getElementById('prog-confidence').style.animation = 'none';
    document.getElementById('prog-demand').style.animation = 'none';
    requestAnimationFrame(() => {
      document.getElementById('prog-confidence').style.animation = '';
      document.getElementById('prog-demand').style.animation = '';
    });

  } catch (error) {
    console.error('API Error:', error);
    btn.classList.remove('loading');
    alert("Could not connect to the R backend. Please make sure you have saved your model and started the api.R script in RStudio!");
  }
}

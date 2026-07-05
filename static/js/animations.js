document.addEventListener('DOMContentLoaded', () => {
  const particleLayer = document.getElementById('particleLayer');
  if (particleLayer) {
    for (let i = 0; i < 40; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${8 + Math.random() * 10}s`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particleLayer.appendChild(particle);
    }
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      themeToggle.textContent = document.body.classList.contains('light') ? '☀' : '☾';
    });
  }
});

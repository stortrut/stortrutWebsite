
document.querySelectorAll('.star-rating').forEach(el => {
  const score = parseFloat(el.dataset.score) || 0;

  // Create a temporary span with one star to measure its width
  const tempSpan = document.createElement('span');
  tempSpan.style.fontFamily = getComputedStyle(el).fontFamily;
  tempSpan.style.fontSize = getComputedStyle(el).fontSize;
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.textContent = '★';
  document.body.appendChild(tempSpan);

  const singleStarWidth = tempSpan.getBoundingClientRect().width;

  // Clean up temporary span
  document.body.removeChild(tempSpan);

  const totalWidth = singleStarWidth * 5;

  const fillWidth = (score / 5) * totalWidth;

  el.querySelector('.star-fill').style.width = fillWidth + 'px';
});


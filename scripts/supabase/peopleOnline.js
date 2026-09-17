const SUPABASE_URL = 'https://ckcbrmdchbfvazmosqwm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_M9wbeEVtx8pDNPORz75l0A_BbCeI0nB';

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const visitorKey = crypto.randomUUID();

const channel = client.channel('website-online-visitors', {
  config: {
    presence: {
      key: visitorKey
    }
  }
});

function getCounterElement() {
  return document.getElementById('online-count');
}

function updateOnlineCount() {
  const counterElement = getCounterElement();

  // The shared element has not been inserted yet
  if (!counterElement) {
    return;
  }

  const presenceState = channel.presenceState();

  const count = Object.values(presenceState)
    .reduce((total, visitors) => total + visitors.length, 0);

  counterElement.textContent = count;
}

channel
  .on('presence', { event: 'sync' }, updateOnlineCount)
  .on('presence', { event: 'join' }, updateOnlineCount)
  .on('presence', { event: 'leave' }, updateOnlineCount)
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        online_at: new Date().toISOString()
      });

      updateOnlineCount();
    }
  });

// Watch for the counter element being inserted later
const observer = new MutationObserver(() => {
  if (getCounterElement()) {
    updateOnlineCount();
    observer.disconnect();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

window.addEventListener('beforeunload', () => {
  client.removeChannel(channel);
});





async function countWebsiteVisit() {
    const visitKey = 'website-visit-counted';
    const savedTotal = sessionStorage.getItem('website-visit-total');
    const counter = document.getElementById('website-visit-count');

    // Already counted this tab session
    if (sessionStorage.getItem(visitKey)) {
        if (counter && savedTotal) {
            counter.textContent = Number(savedTotal).toLocaleString();
        }
        return;
    }

    const { data, error } = await client.rpc('increment_site_visits');

    if (error) {
        console.error('Could not count website visit:', error);
        return;
    }

    sessionStorage.setItem(visitKey, 'true');
    sessionStorage.setItem('website-visit-total', data);

    if (counter) {
        counter.textContent = Number(data).toLocaleString();
    }
}


countWebsiteVisit();
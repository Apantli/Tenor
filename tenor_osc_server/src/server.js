import osc from 'osc';

const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 5000,
  metadata: true,
});

let values = {};
let last_sent = Date.now();
const interval = 100;

const addresses = {
  '/muse/elements/delta_absolute': 'delta',
  '/muse/elements/theta_absolute': 'theta',
  '/muse/elements/alpha_absolute': 'alpha',
  '/muse/elements/beta_absolute': 'beta',
  '/muse/elements/gamma_absolute': 'gamma',
};
const signals = ['delta', 'theta', 'alpha', 'beta', 'gamma'];

udpPort.on('message', (msg, timeTag) => {
  const signal = addresses[msg.address];
  if (signal != null) {
    values[signal] = msg.args[0].value * 100;

    // Wait an interval before sending data (to reduce spam)
    if (Date.now() - last_sent > interval) {
      let full = true;

      // Make sure all signals have a value
      signals.forEach((signal) => {
        if (!(signal in values)) {
          full = false;
        }
      });

      if (full) {
        fetch('http://localhost:3000/api/muse_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signals: values,
            timestamp: Date.now(),
          }),
        });
        values = {};
        last_sent = Date.now();
        console.log('SENT DATA');
      }
    }
  }
});

udpPort.open();

udpPort.on('ready', () => {
  console.log('OSC Server listening for UDP on port 5000');
});

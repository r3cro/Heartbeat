const express = require('express');
const ping = require('ping');
const nodemailer = require('nodemailer');
const app = express();


// Middleware function to log incoming requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Configure your email settings
const emailConfig = {
    service: 'Gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  };

const transporter = nodemailer.createTransport(emailConfig);

// Route handler for the home page
app.get('/', async (req, res) => {
    const serverStatuses = [
        { name: '  Automate', ip: '10.1.11.130' },
        { name: '  11 HOST', ip: '10.1.11.11' },
        { name: '  15 HOST', ip: '10.1.11.15' },
        { name: '  59 HOST', ip: '10.1.11.59' },
        { name: '  DEV01', ip: '10.1.11.114' },
        { name: '  DEV02', ip: '10.1.11.113' },
        { name: '  DEV03', ip: '10.1.11.89' },
        { name: '  my phone', ip: '10.1.11.111' },
        // Add more objects for additional server instances
      ];
  
    try {
      const statusItems = await Promise.all(serverStatuses.map(async (server) => {
        const isAlive = await pingServer(server.ip);
        const statusClass = isAlive ? 'up' : 'down';
  
        if (!isAlive) {
            sendEmailAlert(server.name); // Send email alert if the server is offline
          }

        return `
          <div class="status-item">
            <h3>${server.name}</h3>
            <p class="status ${statusClass}">${isAlive ? 'Online' : 'Offline'}</p>
          </div>
        `;
      }));
  
      const countdownSeconds = 15; // Number of seconds for the countdown timer
  
      const message = `
        <html>
        <head>
          <link rel="stylesheet" type="text/css" href="/styles.css">
          <script>
            function startCountdown() {
              var countdownElement = document.getElementById('countdown');
              var seconds = ${countdownSeconds};
  
              var countdownInterval = setInterval(function() {
                countdownElement.textContent = seconds;
  
                if (seconds === 0) {
                  clearInterval(countdownInterval);
                  location.reload(); // Refresh the page when countdown reaches 0
                }
  
                seconds--;
              }, 1000);
            }
  
            // Start the countdown when the page loads
            window.onload = function() {
              startCountdown();
            };
          </script>
        </head>
        <body>
          <header>
            <h1>  Phantom Point Status</h1>
          </header>
          
          <section id="status-section">
            <h2>Current Status</h2>
            <p id="refresh-counter"></p>
            <div id="status-container">
              ${statusItems.join('')}
            </div>
          </section>
        
          <footer>
            <p>&copy; 2023 Logan Manlief</p>
          </footer>
  
          <script>
          var refreshCounterElement = document.getElementById('refresh-counter');
          var seconds = 15;
        
          function updateCounter() {
            refreshCounterElement.textContent = 'Refresh Counter: ' + seconds;
        
            if (seconds === 0) {
              location.reload(); // Refresh the page when countdown reaches 0
            } else {
              seconds--;
              setTimeout(updateCounter, 1000);
            }
          }
        
          // Start the countdown when the page loads
          window.onload = function() {
            updateCounter();
          };
        </script>
        </body>
        </html>`;
    
      res.send(message);
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send('An error occurred');
    }
  });
  
  function pingServer(ip) {
    return new Promise((resolve) => {
      ping.sys.probe(ip, (isAlive) => {
        resolve(isAlive); // Resolve with the result of the ping check
      });
    });
  }

  function sendEmailAlert(serverName) {
    const mailOptions = {
      from: emailConfig.auth.user,
      to: 'recipient@example.com',
      subject: 'Server Offline Alert',
      text: `The server "${serverName}" is offline.`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }

// Middleware function to handle 404 errors
app.use((req, res) => {
  res.status(404).send('<h1>404 Page Not Found</h1>');
});

// Middleware function to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<h1>Internal Server Error</h1>');
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
